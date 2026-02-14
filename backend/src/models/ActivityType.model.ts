import mongoose, { Schema, Document, Model } from 'mongoose';

// Sub-documento para configuración de roles en actividad
export interface IActivityRoleConfig {
  _id?: mongoose.Types.ObjectId;
  sectionName: string;
  sectionOrder: number;
  role: {
    id: mongoose.Types.ObjectId;
    name: string;
  };
  peopleNeeded: number;
  isRequired: boolean;
}

// Sub-documento para horario por día
export interface IScheduleEntry {
  day: number; // 0=Domingo, 6=Sábado
  time: string; // HH:mm formato
}

// Interface para el documento principal
export interface IActivityType extends Document {
  _id: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  daysOfWeek: number[]; // Array de días: 0=Domingo, 6=Sábado
  dayOfWeek: number; // COMPAT: retorna daysOfWeek[0] o 0
  defaultTime: string; // HH:mm formato (fallback)
  schedule: IScheduleEntry[]; // Horarios por día
  roleConfig: IActivityRoleConfig[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Métodos
  getTotalPeopleNeeded(): number;
  getRoleConfigById(id: string | mongoose.Types.ObjectId): IActivityRoleConfig | undefined;
  getTimeForDay(day: number): string;
}

// Schema para configuración de roles
const ActivityRoleConfigSchema = new Schema<IActivityRoleConfig>(
  {
    sectionName: {
      type: String,
      required: [true, 'El nombre de la sección es requerido'],
      trim: true,
      maxlength: [100, 'El nombre de la sección no puede exceder 100 caracteres'],
    },
    sectionOrder: {
      type: Number,
      required: [true, 'El orden de la sección es requerido'],
      min: [1, 'El orden mínimo es 1'],
    },
    role: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    peopleNeeded: {
      type: Number,
      required: [true, 'La cantidad de personas es requerida'],
      min: [1, 'Mínimo 1 persona requerida'],
      max: [10, 'Máximo 10 personas por rol'],
      default: 1,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

// Schema principal de ActivityType
const ActivityTypeSchema = new Schema<IActivityType>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'El ID de la iglesia es requerido'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre de la actividad es requerido'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    daysOfWeek: {
      type: [Number],
      required: [true, 'Al menos un día de la semana es requerido'],
      validate: {
        validator: (v: number[]) => v.length > 0 && v.every(d => d >= 0 && d <= 6),
        message: 'Cada día debe estar entre 0 (Domingo) y 6 (Sábado)',
      },
      default: [0], // Domingo
    },
    defaultTime: {
      type: String,
      required: [true, 'La hora predeterminada es requerida'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'],
      default: '10:00',
    },
    schedule: {
      type: [{
        day: { type: Number, required: true, min: 0, max: 6 },
        time: { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
      }],
      default: [],
    },
    roleConfig: {
      type: [ActivityRoleConfigSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'activityTypes',
  }
);

// Virtual: dayOfWeek para compatibilidad (retorna el primer día)
ActivityTypeSchema.virtual('dayOfWeek').get(function () {
  return this.daysOfWeek?.[0] ?? 0;
});

// Asegurar que los virtuals se incluyan en JSON y Object
ActivityTypeSchema.set('toJSON', { virtuals: true });
ActivityTypeSchema.set('toObject', { virtuals: true });

// Índices
ActivityTypeSchema.index({ churchId: 1, name: 1 });
ActivityTypeSchema.index({ churchId: 1, isActive: 1 });
ActivityTypeSchema.index({ churchId: 1, daysOfWeek: 1 });

// Método: obtener total de personas necesarias
ActivityTypeSchema.methods.getTotalPeopleNeeded = function (): number {
  return this.roleConfig.reduce(
    (total: number, config: IActivityRoleConfig) => total + config.peopleNeeded,
    0
  );
};

// Método: obtener configuración de rol por ID
ActivityTypeSchema.methods.getRoleConfigById = function (
  id: string | mongoose.Types.ObjectId
): IActivityRoleConfig | undefined {
  const idStr = id.toString();
  return this.roleConfig.find(
    (config: IActivityRoleConfig) => config._id?.toString() === idStr
  );
};

// Método: obtener hora para un día específico (busca en schedule, fallback a defaultTime)
ActivityTypeSchema.methods.getTimeForDay = function (day: number): string {
  const entry = this.schedule?.find((s: IScheduleEntry) => s.day === day);
  return entry?.time || this.defaultTime || '10:00';
};

// Compatibilidad: si llega dayOfWeek como número (legacy), convertir a daysOfWeek
ActivityTypeSchema.pre('save', function (next) {
  const raw = (this as any)._doc;
  // Si alguien envió dayOfWeek como número y no daysOfWeek, convertir
  if (raw.dayOfWeek !== undefined && typeof raw.dayOfWeek === 'number' && (!raw.daysOfWeek || raw.daysOfWeek.length === 0)) {
    this.daysOfWeek = [raw.dayOfWeek];
    delete raw.dayOfWeek;
  }
  next();
});

// Validación: no permitir duplicados de nombre en la misma iglesia
ActivityTypeSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('name')) {
    const existingActivity = await (this.constructor as Model<IActivityType>).findOne({
      churchId: this.churchId,
      name: { $regex: new RegExp(`^${this.name}$`, 'i') },
      _id: { $ne: this._id },
    });

    if (existingActivity) {
      const error = new Error(`Ya existe una actividad con el nombre "${this.name}"`);
      return next(error);
    }
  }
  next();
});

// Validación: ordenar roleConfig por sectionOrder antes de guardar
ActivityTypeSchema.pre('save', function (next) {
  if (this.roleConfig && this.roleConfig.length > 0) {
    this.roleConfig.sort((a, b) => a.sectionOrder - b.sectionOrder);
  }
  next();
});

// Exportar modelo
const ActivityType: Model<IActivityType> = mongoose.model<IActivityType>(
  'ActivityType',
  ActivityTypeSchema
);
export default ActivityType;

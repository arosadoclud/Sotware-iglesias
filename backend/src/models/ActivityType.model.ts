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

// Interface para el documento principal
export interface IActivityType extends Document {
  _id: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  dayOfWeek: number; // 0=Domingo, 6=Sábado
  defaultTime: string; // HH:mm formato
  roleConfig: IActivityRoleConfig[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  getTotalPeopleNeeded(): number;
  getRoleConfigById(id: string | mongoose.Types.ObjectId): IActivityRoleConfig | undefined;
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
    dayOfWeek: {
      type: Number,
      required: [true, 'El día de la semana es requerido'],
      min: [0, 'El día debe estar entre 0 (Domingo) y 6 (Sábado)'],
      max: [6, 'El día debe estar entre 0 (Domingo) y 6 (Sábado)'],
      default: 0, // Domingo
    },
    defaultTime: {
      type: String,
      required: [true, 'La hora predeterminada es requerida'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'],
      default: '10:00',
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

// Índices
ActivityTypeSchema.index({ churchId: 1, name: 1 });
ActivityTypeSchema.index({ churchId: 1, isActive: 1 });
ActivityTypeSchema.index({ churchId: 1, dayOfWeek: 1 });

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

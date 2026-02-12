import mongoose, { Schema, Document, Model } from 'mongoose';

// Enum para status
export enum PersonStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  NEW = 'NEW',
  LEADER = 'LEADER',
}

// Sub-documento para roles permitidos
export interface IPersonRole {
  roleId: mongoose.Types.ObjectId;
  roleName: string;
}

// Sub-documento para no disponibilidad
export interface IUnavailability {
  _id?: mongoose.Types.ObjectId;
  from: Date;
  to: Date;
  reason?: string;
}

// Interface para el documento principal
export interface IPerson extends Document {
  _id: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;
  fullName: string;
  phone?: string;
  email?: string;
  ministry?: string;
  status: PersonStatus;
  priority: number;
  roles: IPersonRole[];
  unavailability: IUnavailability[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  isAvailableOn(date: Date): boolean;
  hasRole(roleId: string | mongoose.Types.ObjectId): boolean;
  addRole(roleId: mongoose.Types.ObjectId, roleName: string): void;
  removeRole(roleId: mongoose.Types.ObjectId): void;
}

// Schema para roles permitidos
const PersonRoleSchema = new Schema<IPersonRole>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    roleName: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Schema para no disponibilidad
const UnavailabilitySchema = new Schema<IUnavailability>(
  {
    from: {
      type: Date,
      required: [true, 'La fecha de inicio es requerida'],
    },
    to: {
      type: Date,
      required: [true, 'La fecha de fin es requerida'],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [200, 'La razón no puede exceder 200 caracteres'],
    },
  },
  { _id: true }
);

// Validación: fecha 'to' debe ser mayor o igual a 'from'
UnavailabilitySchema.pre('save', function (next) {
  if (this.to < this.from) {
    const error = new Error('La fecha de fin debe ser mayor o igual a la fecha de inicio');
    return next(error);
  }
  next();
});

// Schema principal de Person
const PersonSchema = new Schema<IPerson>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'El ID de la iglesia es requerido'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'El nombre completo es requerido'],
      trim: true,
      maxlength: [255, 'El nombre no puede exceder 255 caracteres'],
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingrese un email válido',
      ],
    },
    ministry: {
      type: String,
      trim: true,
      maxlength: [100, 'El ministerio no puede exceder 100 caracteres'],
    },
    status: {
      type: String,
      enum: Object.values(PersonStatus),
      default: PersonStatus.ACTIVE,
      required: true,
    },
    priority: {
      type: Number,
      default: 1,
      min: [1, 'La prioridad mínima es 1'],
      max: [10, 'La prioridad máxima es 10'],
    },
    roles: {
      type: [PersonRoleSchema],
      default: [],
    },
    unavailability: {
      type: [UnavailabilitySchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres'],
    },
  },
  {
    timestamps: true,
    collection: 'persons',
  }
);

// ─── ÍNDICES OPTIMIZADOS — Paso 4 ───────────────────────────────────────────
// Búsqueda por nombre dentro de una iglesia
PersonSchema.index({ churchId: 1, fullName: 1 });

// AssignmentEngine: carga todos los activos de una iglesia de una vez
PersonSchema.index({ churchId: 1, status: 1 });

// CRÍTICO para el motor: buscar personas por rol dentro de una iglesia
// Sin este índice, la carga de candidatos es un full scan
PersonSchema.index({ churchId: 1, 'roles.roleId': 1, status: 1 });

// Filtrar por ministerio dentro de una iglesia (MINISTRY_LEADER scope)
PersonSchema.index({ churchId: 1, ministry: 1 });

// Ordenar por prioridad para desempates en el motor
PersonSchema.index({ churchId: 1, status: 1, priority: -1 });

// Método: verificar disponibilidad en una fecha
PersonSchema.methods.isAvailableOn = function (date: Date): boolean {
  if (this.status === PersonStatus.INACTIVE) {
    return false;
  }

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  for (const unavail of this.unavailability) {
    const from = new Date(unavail.from);
    const to = new Date(unavail.to);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    if (checkDate >= from && checkDate <= to) {
      return false;
    }
  }

  return true;
};

// Método: verificar si tiene un rol
PersonSchema.methods.hasRole = function (
  roleId: string | mongoose.Types.ObjectId
): boolean {
  const roleIdStr = roleId.toString();
  return this.roles.some((r: IPersonRole) => r.roleId.toString() === roleIdStr);
};

// Método: agregar rol
PersonSchema.methods.addRole = function (
  roleId: mongoose.Types.ObjectId,
  roleName: string
): void {
  if (!this.hasRole(roleId)) {
    this.roles.push({ roleId, roleName });
  }
};

// Método: remover rol
PersonSchema.methods.removeRole = function (
  roleId: mongoose.Types.ObjectId
): void {
  const roleIdStr = roleId.toString();
  this.roles = this.roles.filter(
    (r: IPersonRole) => r.roleId.toString() !== roleIdStr
  );
};

// Virtual para contar participaciones (se implementará con aggregate)
PersonSchema.virtual('participationCount', {
  ref: 'Program',
  localField: '_id',
  foreignField: 'assignments.person.id',
  count: true,
});

// Exportar modelo
const Person: Model<IPerson> = mongoose.model<IPerson>('Person', PersonSchema);
export default Person;

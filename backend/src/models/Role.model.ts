import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface para el documento
export interface IRole extends Document {
  _id: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  requiresSkill: boolean;
  color?: string; // Para UI (hex color)
  icon?: string; // Para UI (nombre del ícono)
  createdAt: Date;
  updatedAt: Date;
}

// Schema
const RoleSchema = new Schema<IRole>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'El ID de la iglesia es requerido'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre del rol es requerido'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    requiresSkill: {
      type: Boolean,
      default: false,
      required: true,
    },
    color: {
      type: String,
      trim: true,
      default: '#3B82F6', // Blue
      match: [/^#[0-9A-F]{6}$/i, 'Color debe ser formato hexadecimal (#RRGGBB)'],
    },
    icon: {
      type: String,
      trim: true,
      default: 'user',
    },
  },
  {
    timestamps: true,
    collection: 'roles',
  }
);

// Índices
RoleSchema.index({ churchId: 1, name: 1 }, { unique: true });
RoleSchema.index({ churchId: 1, requiresSkill: 1 });

// Validación: no permitir duplicados de nombre en la misma iglesia
RoleSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('name')) {
    const existingRole = await (this.constructor as Model<IRole>).findOne({
      churchId: this.churchId,
      name: { $regex: new RegExp(`^${this.name}$`, 'i') },
      _id: { $ne: this._id },
    });

    if (existingRole) {
      const error = new Error(`Ya existe un rol con el nombre "${this.name}"`);
      return next(error);
    }
  }
  next();
});

// Exportar modelo
const Role: Model<IRole> = mongoose.model<IRole>('Role', RoleSchema);
export default Role;

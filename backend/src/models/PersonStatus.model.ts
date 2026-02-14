import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface para el documento principal
export interface IPersonStatus extends Document {
  _id: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  color: string; // Color para badge (ej: "green", "blue", "red")
  description?: string;
  isDefault: boolean; // Si es un estado predeterminado del sistema
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Schema principal de PersonStatus
const PersonStatusSchema = new Schema<IPersonStatus>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'El ID de la iglesia es requerido'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre del estado es requerido'],
      trim: true,
      maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
    },
    code: {
      type: String,
      required: [true, 'El código del estado es requerido'],
      trim: true,
      uppercase: true,
      maxlength: [30, 'El código no puede exceder 30 caracteres'],
    },
    color: {
      type: String,
      default: 'gray',
      enum: ['gray', 'green', 'blue', 'red', 'yellow', 'purple', 'pink', 'orange', 'teal', 'indigo'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'La descripción no puede exceder 200 caracteres'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'personStatuses',
  }
);

// Índices
PersonStatusSchema.index({ churchId: 1, code: 1 }, { unique: true });
PersonStatusSchema.index({ churchId: 1, isActive: 1 });
PersonStatusSchema.index({ churchId: 1, order: 1 });

// Validación: no permitir duplicados de nombre en la misma iglesia
PersonStatusSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('name')) {
    const existingStatus = await (this.constructor as Model<IPersonStatus>).findOne({
      churchId: this.churchId,
      name: { $regex: new RegExp(`^${this.name}$`, 'i') },
      _id: { $ne: this._id },
    });

    if (existingStatus) {
      const error = new Error(`Ya existe un estado con el nombre "${this.name}"`);
      return next(error);
    }
  }
  next();
});

// Generar código automáticamente si no se proporciona
PersonStatusSchema.pre('save', function (next) {
  if (!this.code && this.name) {
    this.code = this.name
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 30);
  }
  next();
});

// Exportar modelo
const PersonStatus: Model<IPersonStatus> = mongoose.model<IPersonStatus>(
  'PersonStatus',
  PersonStatusSchema
);

export default PersonStatus;

import mongoose, { Schema, Document } from 'mongoose';

export interface IMinistry extends Document {
  churchId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MinistrySchema = new Schema<IMinistry>({
  churchId: {
    type: Schema.Types.ObjectId,
    ref: 'Church',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    index: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'La descripción no puede exceder 300 caracteres'],
  },
  color: {
    type: String,
    trim: true,
    maxlength: [20, 'El color no puede exceder 20 caracteres'],
    default: '#2563eb', // azul por defecto
  },
}, {
  timestamps: true,
  collection: 'ministries',
});

MinistrySchema.index({ churchId: 1, name: 1 }, { unique: true });

const Ministry = mongoose.model<IMinistry>('Ministry', MinistrySchema);
export default Ministry;

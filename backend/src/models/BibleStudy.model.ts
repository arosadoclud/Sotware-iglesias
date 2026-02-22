import mongoose, { Document, Schema } from 'mongoose';

export interface IBibleStudy extends Document {
  churchId: mongoose.Types.ObjectId;
  title: string;
  studyDate: Date; // Fecha del martes específico
  theme: string; // Tema o versículo clave
  verse?: string; // Versículo específico (opcional)
  description: string;
  teacher?: string; // Maestro/Predicador (opcional)
  series?: string; // Serie a la que pertenece (opcional)
  pdfUrl: string; // URL del PDF en Cloudinary
  pdfPublicId?: string; // ID público de Cloudinary para eliminación
  fileSize?: number; // Tamaño en bytes
  thumbnailUrl?: string; // Imagen destacada (opcional)
  downloadCount: number; // Contador de descargas
  isActive: boolean; // Para ocultar estudios sin eliminarlos
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const BibleStudySchema = new Schema<IBibleStudy>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    studyDate: {
      type: Date,
      required: true,
      index: true,
    },
    theme: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    verse: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    teacher: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    series: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    pdfUrl: {
      type: String,
      required: true,
    },
    pdfPublicId: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    thumbnailUrl: {
      type: String,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'biblestudies',
  }
);

// Índices compuestos para mejor performance
BibleStudySchema.index({ churchId: 1, studyDate: -1 });
BibleStudySchema.index({ churchId: 1, isActive: 1, studyDate: -1 });
BibleStudySchema.index({ churchId: 1, series: 1, studyDate: -1 });

export const BibleStudy = mongoose.model<IBibleStudy>('BibleStudy', BibleStudySchema);

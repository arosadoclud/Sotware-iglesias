import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface para el documento
export interface IGeneratedLetter extends Document {
  _id: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId | string;
  templateName: string;
  recipientName: string;
  recipientEmail?: string;
  finalContent: string; // HTML o texto final
  variablesUsed: Record<string, string>; // Variables y valores usados
  pdfUrl?: string;
  generatedBy: {
    id: mongoose.Types.ObjectId;
    name: string;
  };
  generatedAt: Date;
  createdAt: Date;
}

// Schema
const GeneratedLetterSchema = new Schema<IGeneratedLetter>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'El ID de la iglesia es requerido'],
      index: true,
    },
    templateId: {
      type: Schema.Types.Mixed,
      ref: 'LetterTemplate',
      required: false,
      index: true,
    },
    templateName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientName: {
      type: String,
      required: [true, 'El nombre del destinatario es requerido'],
      trim: true,
      maxlength: [255, 'El nombre no puede exceder 255 caracteres'],
    },
    recipientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingrese un email válido',
      ],
    },
    finalContent: {
      type: String,
      required: [true, 'El contenido final es requerido'],
    },
    variablesUsed: {
      type: Schema.Types.Mixed,
      default: {},
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    generatedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Solo createdAt
    collection: 'generatedLetters',
  }
);

// Índices
GeneratedLetterSchema.index({ churchId: 1, generatedAt: -1 });
GeneratedLetterSchema.index({ churchId: 1, templateId: 1, generatedAt: -1 });
GeneratedLetterSchema.index({ churchId: 1, recipientName: 1 });
GeneratedLetterSchema.index({ generatedAt: -1 });

// Exportar modelo
const GeneratedLetter: Model<IGeneratedLetter> = mongoose.model<IGeneratedLetter>(
  'GeneratedLetter',
  GeneratedLetterSchema
);
export default GeneratedLetter;

import mongoose, { Schema, Document } from 'mongoose';

export interface IConversion extends Document {
  churchId: mongoose.Types.ObjectId;
  personName: string;
  conversionDate: Date;
  context?: string;
  officiant?: string;
  followUpPerson?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversionSchema = new Schema<IConversion>(
  {
    churchId:       { type: Schema.Types.ObjectId, ref: 'Church', required: true, index: true },
    personName:     { type: String, required: true, trim: true },
    conversionDate: { type: Date, required: true, index: true },
    context:        { type: String, trim: true }, // Culto, actividad, etc.
    officiant:      { type: String, trim: true },
    followUpPerson: { type: String, trim: true }, // Responsable de seguimiento
    notes:          { type: String, trim: true },
    createdBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Conversion = mongoose.model<IConversion>('Conversion', ConversionSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IBaptism extends Document {
  churchId: mongoose.Types.ObjectId;
  personName: string;
  birthDate?: Date;
  baptismDate: Date;
  officiant?: string;
  location?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BaptismSchema = new Schema<IBaptism>(
  {
    churchId:    { type: Schema.Types.ObjectId, ref: 'Church', required: true, index: true },
    personName:  { type: String, required: true, trim: true },
    birthDate:   { type: Date },
    baptismDate: { type: Date, required: true, index: true },
    officiant:   { type: String, trim: true },
    location:    { type: String, trim: true },
    notes:       { type: String, trim: true },
    createdBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Baptism = mongoose.model<IBaptism>('Baptism', BaptismSchema);

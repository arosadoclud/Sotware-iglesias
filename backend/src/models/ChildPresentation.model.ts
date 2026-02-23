import mongoose, { Schema, Document } from 'mongoose';

export interface IChildPresentation extends Document {
  churchId: mongoose.Types.ObjectId;
  childName: string;
  sexo?: 'Niño' | 'Niña';
  birthDate: Date;
  fatherName?: string;
  motherName?: string;
  address?: string;
  presentationDate: Date;
  officiant?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChildPresentationSchema = new Schema<IChildPresentation>(
  {
    churchId:         { type: Schema.Types.ObjectId, ref: 'Church', required: true, index: true },
    childName:        { type: String, required: true, trim: true },
    sexo:             { type: String, enum: ['Niño', 'Niña'] },
    birthDate:        { type: Date, required: true },
    fatherName:       { type: String, trim: true },
    motherName:       { type: String, trim: true },
    address:          { type: String, trim: true },
    presentationDate: { type: Date, required: true, index: true },
    officiant:        { type: String, trim: true },
    notes:            { type: String, trim: true },
    createdBy:        { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const ChildPresentation = mongoose.model<IChildPresentation>('ChildPresentation', ChildPresentationSchema);

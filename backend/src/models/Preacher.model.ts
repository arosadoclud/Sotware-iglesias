import mongoose, { Schema, Document } from 'mongoose';

export interface IPreacher extends Document {
  churchId: mongoose.Types.ObjectId;
  fullName: string;
  phone?: string;
  email?: string;
  ministry?: string;
  topics?: string;
  bio?: string;
  notes?: string;
  lastVisit?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PreacherSchema = new Schema<IPreacher>(
  {
    churchId:  { type: Schema.Types.ObjectId, ref: 'Church', required: true, index: true },
    fullName:  { type: String, required: true, trim: true },
    phone:     { type: String, trim: true },
    email:     { type: String, trim: true, lowercase: true },
    ministry:  { type: String, trim: true }, // Iglesia o ministerio de origen
    topics:    { type: String, trim: true }, // Temas que predica / especialidad
    bio:       { type: String, trim: true },
    notes:     { type: String, trim: true },
    lastVisit: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Preacher = mongoose.model<IPreacher>('Preacher', PreacherSchema);

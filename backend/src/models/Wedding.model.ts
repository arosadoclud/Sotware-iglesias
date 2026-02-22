import mongoose, { Schema, Document } from 'mongoose';

export interface IWedding extends Document {
  churchId: mongoose.Types.ObjectId;
  groomName: string;
  brideName: string;
  weddingDate: Date;
  location?: string;
  officiant?: string;
  witnesses?: string[];
  certificateNumber?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WeddingSchema = new Schema<IWedding>(
  {
    churchId:          { type: Schema.Types.ObjectId, ref: 'Church', required: true, index: true },
    groomName:         { type: String, required: true, trim: true },
    brideName:         { type: String, required: true, trim: true },
    weddingDate:       { type: Date, required: true, index: true },
    location:          { type: String, trim: true },
    officiant:         { type: String, trim: true },
    witnesses:         [{ type: String, trim: true }],
    certificateNumber: { type: String, trim: true },
    notes:             { type: String, trim: true },
    createdBy:         { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Wedding = mongoose.model<IWedding>('Wedding', WeddingSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IBoardMinutes extends Document {
  churchId: mongoose.Types.ObjectId;
  meetingDate: Date;
  attendees?: string[];
  topics: string;
  agreements?: string;
  nextMeetingDate?: Date;
  recordedBy?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BoardMinutesSchema = new Schema<IBoardMinutes>(
  {
    churchId:        { type: Schema.Types.ObjectId, ref: 'Church', required: true, index: true },
    meetingDate:     { type: Date, required: true, index: true },
    attendees:       [{ type: String, trim: true }],
    topics:          { type: String, required: true, trim: true }, // Lo que se trató
    agreements:      { type: String, trim: true },                 // Acuerdos tomados
    nextMeetingDate: { type: Date },
    recordedBy:      { type: String, trim: true },                 // Secretario/a que registró
    notes:           { type: String, trim: true },
    createdBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const BoardMinutes = mongoose.model<IBoardMinutes>('BoardMinutes', BoardMinutesSchema);

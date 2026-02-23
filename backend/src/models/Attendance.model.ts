import mongoose, { Schema, Document } from 'mongoose';

// ── Tipos de culto ─────────────────────────────────────────────────────────
export enum ServiceType {
  MARTES_ESTUDIO        = 'MARTES_ESTUDIO',        // Martes – Estudio Bíblico
  MIERCOLES_CULTO       = 'MIERCOLES_CULTO',       // Miércoles – Culto de Damas y Caballeros
  SABADO_JOVENES        = 'SABADO_JOVENES',        // Sábado – Culto de Jóvenes
  DOMINGO_EVANGELISTICO = 'DOMINGO_EVANGELISTICO', // Domingo – Culto Evangelístico General
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  [ServiceType.MARTES_ESTUDIO]:        'Estudio Bíblico (Martes)',
  [ServiceType.MIERCOLES_CULTO]:       'Culto de Damas y Caballeros (Miércoles)',
  [ServiceType.SABADO_JOVENES]:        'Culto de Jóvenes (Sábado)',
  [ServiceType.DOMINGO_EVANGELISTICO]: 'Culto Evangelístico General (Domingo)',
};

// ── Sub-documento: asistente ───────────────────────────────────────────────
export interface IAttendee {
  personId?: mongoose.Types.ObjectId;
  personName: string;
  present: boolean;
  notes?: string;
}

const AttendeeSchema = new Schema<IAttendee>(
  {
    personId:   { type: Schema.Types.ObjectId, ref: 'Person' },
    personName: { type: String, required: true, trim: true },
    present:    { type: Boolean, default: false },
    notes:      { type: String, trim: true, maxlength: 200 },
  },
  { _id: false }
);

// ── Documento principal ────────────────────────────────────────────────────
export interface IAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;
  serviceType: ServiceType;
  date: Date;
  attendees: IAttendee[];
  guestCount: number;         // Visitas sin registro en el sistema
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  totalPresent: number;
  totalAbsent: number;
  totalMembers: number;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      enum: Object.values(ServiceType),
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    attendees: [AttendeeSchema],
    guestCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    createdBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Índice compuesto: una iglesia no puede tener dos registros del mismo culto en la misma fecha
AttendanceSchema.index({ churchId: 1, serviceType: 1, date: 1 }, { unique: true });

// ── Virtuales ──────────────────────────────────────────────────────────────
AttendanceSchema.virtual('totalPresent').get(function (this: IAttendance) {
  return this.attendees.filter((a) => a.present).length;
});

AttendanceSchema.virtual('totalAbsent').get(function (this: IAttendance) {
  return this.attendees.filter((a) => !a.present).length;
});

AttendanceSchema.virtual('totalMembers').get(function (this: IAttendance) {
  return this.attendees.length;
});

const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export default Attendance;

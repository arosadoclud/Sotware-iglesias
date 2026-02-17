import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Fases de seguimiento ─────────────────────────────────────────────────────
export enum FollowUpPhase {
  FIRST_VISIT   = 'FIRST_VISIT',      // Primera visita
  CONTACTED     = 'CONTACTED',        // Contactado
  IN_FOLLOW_UP  = 'IN_FOLLOW_UP',     // En seguimiento
  INTEGRATED    = 'INTEGRATED',       // Integrado
  INACTIVE      = 'INACTIVE',         // Inactivo / no volvió
}

// ── Origen del miembro ────────────────────────────────────────────────────────
export enum MemberSource {
  VISIT         = 'VISIT',            // Visita espontánea
  INVITATION    = 'INVITATION',       // Invitado por alguien
  EVENT         = 'EVENT',            // Evento especial
  SOCIAL_MEDIA  = 'SOCIAL_MEDIA',     // Redes sociales
  TRANSFER      = 'TRANSFER',         // Transferencia de otra iglesia
  OTHER         = 'OTHER',
}

// ── Sub-documento: Registro de seguimiento ────────────────────────────────────
export interface IFollowUpEntry {
  _id?: mongoose.Types.ObjectId;
  date: Date;
  type: 'CALL' | 'WHATSAPP' | 'VISIT' | 'NOTE';
  note: string;
  madeBy: string;     // Nombre del responsable
  whatsappSent?: boolean;
}

const FollowUpEntrySchema = new Schema<IFollowUpEntry>(
  {
    date:          { type: Date, default: Date.now },
    type:          { type: String, enum: ['CALL', 'WHATSAPP', 'VISIT', 'NOTE'], required: true },
    note:          { type: String, required: true, trim: true, maxlength: 500 },
    madeBy:        { type: String, required: true, trim: true },
    whatsappSent:  { type: Boolean, default: false },
  },
  { _id: true, timestamps: false }
);

// ── Sub-documento: Alertas programadas ────────────────────────────────────────
export interface IScheduledAlert {
  _id?: mongoose.Types.ObjectId;
  scheduledDate: Date;
  message: string;
  type: 'WHATSAPP' | 'INTERNAL';
  sent: boolean;
  sentAt?: Date;
}

const ScheduledAlertSchema = new Schema<IScheduledAlert>(
  {
    scheduledDate: { type: Date, required: true },
    message:       { type: String, required: true, trim: true, maxlength: 500 },
    type:          { type: String, enum: ['WHATSAPP', 'INTERNAL'], default: 'INTERNAL' },
    sent:          { type: Boolean, default: false },
    sentAt:        { type: Date },
  },
  { _id: true }
);

// ── Documento principal ───────────────────────────────────────────────────────
export interface INewMember extends Document {
  _id: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  age?: number;
  gender?: 'M' | 'F';
  source: MemberSource;
  invitedBy?: string;       // Nombre de quien lo invitó
  firstVisitDate: Date;
  phase: FollowUpPhase;
  notes?: string;
  interests?: string[];     // Ej: ["Alabanza", "Jóvenes", "Damas"]
  assignedTo?: string;      // Persona responsable del seguimiento
  followUpHistory: IFollowUpEntry[];
  scheduledAlerts: IScheduledAlert[];
  convertedToPersonId?: mongoose.Types.ObjectId; // Si se convirtió en miembro completo
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NewMemberSchema = new Schema<INewMember>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'La iglesia es requerida'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'El nombre completo es requerido'],
      trim: true,
      maxlength: 255,
    },
    phone: { type: String, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido'],
    },
    address:  { type: String, trim: true, maxlength: 300 },
    age:      { type: Number, min: 0, max: 120 },
    gender:   { type: String, enum: ['M', 'F'] },
    source: {
      type: String,
      enum: Object.values(MemberSource),
      default: MemberSource.VISIT,
    },
    invitedBy: { type: String, trim: true },
    firstVisitDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    phase: {
      type: String,
      enum: Object.values(FollowUpPhase),
      default: FollowUpPhase.FIRST_VISIT,
    },
    notes:     { type: String, trim: true, maxlength: 1000 },
    interests: [{ type: String, trim: true }],
    assignedTo: { type: String, trim: true },
    followUpHistory: {
      type: [FollowUpEntrySchema],
      default: [],
    },
    scheduledAlerts: {
      type: [ScheduledAlertSchema],
      default: [],
    },
    convertedToPersonId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'new_members',
  }
);

// ── Índices ──────────────────────────────────────────────────────────────────
NewMemberSchema.index({ churchId: 1, phase: 1 });
NewMemberSchema.index({ churchId: 1, isActive: 1 });
NewMemberSchema.index({ churchId: 1, firstVisitDate: -1 });
NewMemberSchema.index({ 'scheduledAlerts.scheduledDate': 1, 'scheduledAlerts.sent': 1 });

const NewMember: Model<INewMember> = mongoose.model<INewMember>('NewMember', NewMemberSchema);
export default NewMember;

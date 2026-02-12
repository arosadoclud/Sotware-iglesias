import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface para el documento
export interface IChurch extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  logoUrl?: string;
  address: {
    street?: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  settings: {
    timezone: string;
    rotationWeeks: number;
    allowRepetitions: boolean;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
    whatsappEnabled: boolean;
    defaultTime?: string;
  };
  // SaaS — Paso 7
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  brandColor?: string;
  pastorName?: string;
  signatureUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema
const ChurchSchema = new Schema<IChurch>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la iglesia es requerido'],
      trim: true,
      maxlength: [255, 'El nombre no puede exceder 255 caracteres'],
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'La ciudad es requerida'],
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        required: [true, 'El país es requerido'],
        trim: true,
        default: 'República Dominicana',
      },
      postalCode: {
        type: String,
        trim: true,
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingrese un email válido',
      ],
    },
    website: {
      type: String,
      trim: true,
    },
    settings: {
      timezone: { type: String, default: 'America/Santo_Domingo' },
      rotationWeeks: { type: Number, default: 4, min: [2, 'Mínimo 2 semanas'], max: [12, 'Máximo 12 semanas'] },
      allowRepetitions: { type: Boolean, default: false },
      dateFormat: { type: String, enum: ['DD/MM/YYYY', 'MM/DD/YYYY'], default: 'DD/MM/YYYY' },
      whatsappEnabled: { type: Boolean, default: false },
      defaultTime: { type: String, default: '10:00' },
    },
    // SaaS — Paso 7
    plan: {
      type: String,
      enum: ['FREE', 'PRO', 'ENTERPRISE'],
      default: 'FREE',
    },
    brandColor: { type: String, trim: true, default: '#1e3a5f' },
    pastorName: { type: String, trim: true },
    signatureUrl: { type: String, trim: true },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'churches',
  }
);

// Índices
ChurchSchema.index({ name: 1 });
ChurchSchema.index({ isActive: 1 });

// Método para obtener dirección completa
ChurchSchema.methods.getFullAddress = function (): string {
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.country,
    this.address.postalCode,
  ].filter(Boolean);

  return parts.join(', ');
};

// Exportar modelo
const Church: Model<IChurch> = mongoose.model<IChurch>('Church', ChurchSchema);
export default Church;

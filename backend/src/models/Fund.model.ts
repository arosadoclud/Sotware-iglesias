import mongoose, { Schema, Document } from 'mongoose'

export interface IFund extends Document {
  church: mongoose.Types.ObjectId
  name: string
  code: string
  description?: string
  color: string
  balance: number
  goal?: number
  isRestricted: boolean
  isDefault: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const FundSchema = new Schema<IFund>(
  {
    church: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    balance: {
      type: Number,
      default: 0,
    },
    goal: {
      type: Number,
    },
    isRestricted: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Índices
FundSchema.index({ church: 1, code: 1 }, { unique: true })
FundSchema.index({ church: 1, isActive: 1 })

export const Fund = mongoose.model<IFund>('Fund', FundSchema)

// Fondos predeterminados
export const DEFAULT_FUNDS = [
  { 
    code: 'GENERAL', 
    name: 'Fondo General', 
    description: 'Operaciones del día a día', 
    color: '#3b82f6', 
    isRestricted: false,
    isDefault: true,
  },
  { 
    code: 'CONSTRUCCION', 
    name: 'Fondo de Construcción', 
    description: 'Mejoras y construcción del templo', 
    color: '#f59e0b', 
    isRestricted: true,
    isDefault: false,
  },
  { 
    code: 'MISIONES', 
    name: 'Fondo Misionero', 
    description: 'Apoyo a misiones y misioneros', 
    color: '#22c55e', 
    isRestricted: true,
    isDefault: false,
  },
]

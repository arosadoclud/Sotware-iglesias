import mongoose, { Schema, Document } from 'mongoose'

export interface IFinanceTransaction extends Document {
  church: mongoose.Types.ObjectId
  type: 'INCOME' | 'EXPENSE'
  category: mongoose.Types.ObjectId
  fund: mongoose.Types.ObjectId
  amount: number
  date: Date
  description?: string
  // Para diezmos: persona asociada
  person?: mongoose.Types.ObjectId
  // Para gastos: quién lo aprobó
  approvedBy?: mongoose.Types.ObjectId
  approvalRequired: boolean
  approvalStatus: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  // Método de pago
  paymentMethod: 'CASH' | 'CHECK' | 'TRANSFER' | 'CARD' | 'OTHER'
  reference?: string // Número de cheque, transferencia, etc.
  // Comprobante
  receiptUrl?: string
  receiptNumber?: string
  // Conciliación bancaria
  reconciled: boolean
  reconciledAt?: Date
  reconciledBy?: mongoose.Types.ObjectId
  // Usuario que registró
  createdBy: mongoose.Types.ObjectId
  // Usuario que actualizó
  updatedBy?: mongoose.Types.ObjectId
  // Metadatos
  notes?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

const FinanceTransactionSchema = new Schema<IFinanceTransaction>(
  {
    church: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: true,
    },
    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE'],
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'FinanceCategory',
      required: true,
    },
    fund: {
      type: Schema.Types.ObjectId,
      ref: 'Fund',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
    person: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalRequired: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NOT_REQUIRED',
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CHECK', 'TRANSFER', 'CARD', 'OTHER'],
      default: 'CASH',
    },
    reference: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String,
    },
    receiptNumber: {
      type: String,
      trim: true,
    },
    reconciled: {
      type: Boolean,
      default: false,
    },
    reconciledAt: {
      type: Date,
    },
    reconciledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
)

// Índices para búsquedas eficientes
FinanceTransactionSchema.index({ church: 1, date: -1 })
FinanceTransactionSchema.index({ church: 1, type: 1, date: -1 })
FinanceTransactionSchema.index({ church: 1, category: 1, date: -1 })
FinanceTransactionSchema.index({ church: 1, fund: 1, date: -1 })
FinanceTransactionSchema.index({ church: 1, person: 1, date: -1 })
FinanceTransactionSchema.index({ church: 1, approvalStatus: 1 })

// Virtuals para obtener el nombre de la categoría
FinanceTransactionSchema.virtual('categoryName', {
  ref: 'FinanceCategory',
  localField: 'category',
  foreignField: '_id',
  justOne: true,
})

export const FinanceTransaction = mongoose.model<IFinanceTransaction>('FinanceTransaction', FinanceTransactionSchema)

// Constantes de configuración
export const PAYMENT_METHODS = {
  CASH: { label: 'Efectivo', icon: 'banknote' },
  CHECK: { label: 'Cheque', icon: 'file-text' },
  TRANSFER: { label: 'Transferencia', icon: 'arrow-right-left' },
  CARD: { label: 'Tarjeta', icon: 'credit-card' },
  OTHER: { label: 'Otro', icon: 'more-horizontal' },
}

export const APPROVAL_THRESHOLDS = {
  NO_APPROVAL: 500,      // Menos de $500: sin aprobación
  TREASURER: 2000,       // $500 - $2000: tesorero
  BOARD: 10000,          // $2000 - $10000: junta directiva
  ASSEMBLY: Infinity,    // Más de $10000: asamblea general
}

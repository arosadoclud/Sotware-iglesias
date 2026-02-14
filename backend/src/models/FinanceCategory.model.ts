import mongoose, { Schema, Document } from 'mongoose'

export interface IFinanceCategory extends Document {
  church: mongoose.Types.ObjectId
  name: string
  code: string
  type: 'INCOME' | 'EXPENSE'
  description?: string
  color: string
  icon?: string
  isDefault: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const FinanceCategorySchema = new Schema<IFinanceCategory>(
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
    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    icon: {
      type: String,
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
FinanceCategorySchema.index({ church: 1, code: 1 }, { unique: true })
FinanceCategorySchema.index({ church: 1, type: 1, isActive: 1 })

export const FinanceCategory = mongoose.model<IFinanceCategory>('FinanceCategory', FinanceCategorySchema)

// Categorías predeterminadas
export const DEFAULT_INCOME_CATEGORIES = [
  { code: 'ING-01', name: 'Diezmos', description: '10% de los ingresos de los miembros', color: '#22c55e', icon: 'heart' },
  { code: 'ING-02', name: 'Ofrendas', description: 'Ofrendas generales de los servicios', color: '#3b82f6', icon: 'gift' },
  { code: 'ING-03', name: 'Ofrendas Especiales', description: 'Ofrendas misioneras, pro-templo, benevolencia', color: '#8b5cf6', icon: 'star' },
  { code: 'ING-04', name: 'Otros Ingresos', description: 'Eventos, donaciones, intereses', color: '#f59e0b', icon: 'coins' },
]

export const DEFAULT_EXPENSE_CATEGORIES = [
  { code: 'GAS-01', name: 'Nómina/Honorarios', description: 'Salarios del pastor, músicos, personal', color: '#ef4444', icon: 'users' },
  { code: 'GAS-02', name: 'Servicios Básicos', description: 'Luz, agua, teléfono, internet', color: '#f97316', icon: 'zap' },
  { code: 'GAS-03', name: 'Mantenimiento', description: 'Reparaciones, limpieza, jardinería', color: '#84cc16', icon: 'wrench' },
  { code: 'GAS-04', name: 'Ministerios', description: 'Escuela dominical, jóvenes, damas, caballeros', color: '#06b6d4', icon: 'book-open' },
  { code: 'GAS-05', name: 'Aportación Concilio', description: 'Porcentaje mensual a la denominación', color: '#6366f1', icon: 'building' },
  { code: 'GAS-06', name: 'Otros Gastos', description: 'Eventos, suministros, gastos varios', color: '#a855f7', icon: 'more-horizontal' },
]

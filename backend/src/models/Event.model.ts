import mongoose, { Schema, Document } from 'mongoose'

export interface IEvent extends Document {
  title: string
  description?: string
  imageUrl: string
  type: 'event' | 'flyer' | 'announcement'
  date?: string
  time?: string
  location?: string
  attendees?: number
  isActive: boolean
  order: number
  church: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true,
      maxlength: [200, 'El título no puede exceder 200 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La descripción no puede exceder 1000 caracteres'],
    },
    imageUrl: {
      type: String,
      required: [true, 'La imagen es requerida'],
    },
    type: {
      type: String,
      enum: {
        values: ['event', 'flyer', 'announcement'],
        message: 'El tipo debe ser: event, flyer o announcement',
      },
      default: 'event',
    },
    date: {
      type: String,
      trim: true,
    },
    time: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'La ubicación no puede exceder 200 caracteres'],
    },
    attendees: {
      type: Number,
      min: [0, 'El número de asistentes no puede ser negativo'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    church: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'La iglesia es requerida'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El creador es requerido'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Índices
EventSchema.index({ church: 1, isActive: 1, order: 1 })
EventSchema.index({ church: 1, type: 1, isActive: 1 })
EventSchema.index({ createdAt: -1 })

export default mongoose.model<IEvent>('Event', EventSchema)

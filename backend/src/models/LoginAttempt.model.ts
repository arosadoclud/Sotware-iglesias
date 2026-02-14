import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginAttempt extends Document {
  email: string;
  ipAddress: string;
  attempts: number;
  lastAttempt: Date;
  blockedUntil?: Date;
  isBlocked: boolean;
}

const LoginAttemptSchema = new Schema<ILoginAttempt>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastAttempt: {
      type: Date,
      default: Date.now,
    },
    blockedUntil: {
      type: Date,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas eficientes
LoginAttemptSchema.index({ email: 1, ipAddress: 1 }, { unique: true });

// TTL index - eliminar documentos automáticamente después de 24 horas
LoginAttemptSchema.index({ lastAttempt: 1 }, { expireAfterSeconds: 86400 });

const LoginAttempt = mongoose.model<ILoginAttempt>('LoginAttempt', LoginAttemptSchema);
export default LoginAttempt;

import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Enum para roles — expandido de 3 a 6 roles (Paso 2: RBAC)
// Jerarquía: SUPER_ADMIN > PASTOR > ADMIN > MINISTRY_LEADER > EDITOR > VIEWER
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PASTOR = 'PASTOR',
  ADMIN = 'ADMIN',
  MINISTRY_LEADER = 'MINISTRY_LEADER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

// Interface para el documento
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  comparePassword(candidatePassword: string): Promise<boolean>;
  getPublicProfile(): object;
}

// Schema
const UserSchema = new Schema<IUser>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'El ID de la iglesia es requerido'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingrese un email válido',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // No incluir en queries por defecto
    },
    fullName: {
      type: String,
      required: [true, 'El nombre completo es requerido'],
      trim: true,
      maxlength: [255, 'El nombre no puede exceder 255 caracteres'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.VIEWER,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Índices
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ churchId: 1, role: 1 });
UserSchema.index({ churchId: 1, isActive: 1 });

// Hash de contraseña antes de guardar
UserSchema.pre('save', async function (next) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    throw new Error('Error al comparar contraseñas');
  }
};

// Método para obtener perfil público (sin datos sensibles)
UserSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    email: this.email,
    fullName: this.fullName,
    role: this.role,
    churchId: this.churchId,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

// Método estático para buscar por email
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Exportar modelo
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;

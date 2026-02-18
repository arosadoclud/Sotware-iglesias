import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Permission, DEFAULT_ROLE_PERMISSIONS } from '../config/permissions';

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
  permissions: string[];           // Permisos personalizados
  useCustomPermissions: boolean;   // Si true, usa permissions; si false, usa los del rol
  isSuperUser: boolean;            // Super usuario con todos los permisos (solo uno por iglesia)
  isActive: boolean;
  failedLoginAttempts: number;     // Intentos de login fallidos
  lockUntil?: Date;                // Fecha hasta la cual la cuenta está bloqueada
  passwordResetToken?: string;     // Token para recuperar contraseña
  passwordResetExpires?: Date;     // Expiración del token de recuperación
  lastLogin?: Date;
  refreshToken?: string;
  createdBy?: mongoose.Types.ObjectId; // Usuario que lo creó
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  comparePassword(candidatePassword: string): Promise<boolean>;
  getPublicProfile(): object;
  getEffectivePermissions(): string[];
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
    permissions: {
      type: [String],
      default: [],
    },
    useCustomPermissions: {
      type: Boolean,
      default: false,
    },
    isSuperUser: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Índices (email ya tiene unique: true en la definición del campo)
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
    isSuperUser: this.isSuperUser,
    isActive: this.isActive,
    isLocked: this.lockUntil ? new Date() < this.lockUntil : false,
    lockUntil: this.lockUntil,
    failedLoginAttempts: this.failedLoginAttempts || 0,
    lastLogin: this.lastLogin,
    permissions: this.getEffectivePermissions(),
    useCustomPermissions: this.useCustomPermissions,
    createdAt: this.createdAt,
  };
};

// Método para obtener los permisos efectivos del usuario
UserSchema.methods.getEffectivePermissions = function (): string[] {
  // Si es super usuario, tiene todos los permisos
  if (this.isSuperUser) {
    return Object.values(Permission);
  }
  // Si usa permisos personalizados, retornar esos
  if (this.useCustomPermissions && this.permissions && this.permissions.length > 0) {
    return this.permissions;
  }
  // Si no, retornar los permisos por defecto del rol
  return DEFAULT_ROLE_PERMISSIONS[this.role] || [];
};

// Método estático para buscar por email
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Exportar modelo
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;

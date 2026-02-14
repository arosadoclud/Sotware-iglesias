import { Request, Response, NextFunction } from 'express';
import User from '../../models/User.model';
import jwt from 'jsonwebtoken';
import envConfig from '../../config/env';
import { AuditService, AuditAction, AuditCategory, AuditSeverity } from '../../middleware/audit.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

/**
 * Registrar nuevo usuario (solo para crear el primer admin)
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, churchId } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Email, contraseña y nombre son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }

    // Para SUPER_ADMIN, crear una iglesia por defecto si no se proporciona
    let finalChurchId = churchId;
    if ((role === 'SUPER_ADMIN' || !role) && !churchId) {
      // Importar Church model
      const Church = (await import('../../models/Church.model')).default;
      
      // Crear iglesia por defecto
      const defaultChurch = new Church({
        name: 'Iglesia Principal',
        address: { city: 'Ciudad', country: 'País' },
        settings: {
          timezone: 'America/New_York',
          rotationWeeks: 4,
          allowRepetitions: false,
          dateFormat: 'DD/MM/YYYY',
          whatsappEnabled: true,
        },
        plan: 'PRO',
        isActive: true,
      });
      
      await defaultChurch.save();
      finalChurchId = defaultChurch._id;
    }

    // Crear nuevo usuario
    const newUser = new User({
      email: email.toLowerCase(),
      passwordHash: password, // El pre-save hook lo hasheará
      fullName: name,
      role: role || 'ADMIN',
      churchId: finalChurchId,
      isActive: true,
    });

    await newUser.save();

    // Generar token
    const accessToken = jwt.sign(
      { id: newUser._id, role: newUser.role, churchId: newUser.churchId },
      envConfig.jwtSecret,
      { expiresIn: '1d' }
    );

    const permissions = newUser.getEffectivePermissions();

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          churchId: newUser.churchId,
          permissions,
          useCustomPermissions: newUser.useCustomPermissions,
        },
        accessToken,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Error al crear usuario: ' + error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      // Audit: Login fallido
      await AuditService.log({
        churchId: user.churchId,
        userId: user._id,
        userEmail: user.email,
        userName: user.fullName,
        userRole: user.role,
        action: AuditAction.LOGIN_FAILED,
        category: AuditCategory.AUTH,
        resourceType: 'Auth',
        success: false,
        errorMessage: 'Contraseña incorrecta',
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
        severity: AuditSeverity.WARNING,
      });
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Usuario desactivado. Contacte al administrador.' });
    }

    user.lastLogin = new Date();
    await user.save();

    // Audit: Login exitoso
    await AuditService.log({
      churchId: user.churchId,
      userId: user._id,
      userEmail: user.email,
      userName: user.fullName,
      userRole: user.role,
      action: AuditAction.LOGIN,
      category: AuditCategory.AUTH,
      resourceType: 'Auth',
      success: true,
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    const accessToken = jwt.sign(
      { id: user._id, role: user.role, churchId: user.churchId },
      envConfig.jwtSecret,
      { expiresIn: '1d' }
    );

    // Obtener permisos efectivos
    const permissions = user.getEffectivePermissions();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          churchId: user.churchId,
          permissions,
          useCustomPermissions: user.useCustomPermissions,
        },
        accessToken,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};

/**
 * Obtener usuario actual autenticado
 */
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const permissions = user.getEffectivePermissions();

    res.json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        churchId: user.churchId,
        permissions,
        useCustomPermissions: user.useCustomPermissions,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error: any) {
    console.error('GetMe error:', error);
    next(error);
  }
};

/**
 * Actualizar perfil del usuario actual
 */
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fullName } = req.body;

    if (!fullName?.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    user.fullName = fullName.trim();
    await user.save();

    const permissions = user.getEffectivePermissions();

    res.json({
      success: true,
      message: 'Perfil actualizado',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        churchId: user.churchId,
        permissions,
        useCustomPermissions: user.useCustomPermissions,
      },
    });
  } catch (error: any) {
    console.error('UpdateProfile error:', error);
    next(error);
  }
};

/**
 * Cambiar contraseña del usuario actual
 */
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Contraseña actual y nueva son requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await User.findById(req.userId).select('+passwordHash');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error: any) {
    console.error('ChangePassword error:', error);
    next(error);
  }
};

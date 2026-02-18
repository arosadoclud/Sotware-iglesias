import { Request, Response, NextFunction } from 'express';
import User from '../../models/User.model';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import envConfig from '../../config/env';
import { AuditService, AuditAction, AuditCategory, AuditSeverity } from '../../middleware/audit.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { LoginSecurityService } from '../../services/loginSecurity.service';

/**
 * Registrar nuevo usuario (solo para crear el primer admin)
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, churchId } = req.body;

    // Validar email
    const emailValidation = LoginSecurityService.validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ success: false, message: emailValidation.message });
    }

    // Validar contraseña
    const passwordValidation = LoginSecurityService.validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    if (!name) {
      return res.status(400).json({ success: false, message: 'Nombre es requerido' });
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
    
    // Validar formato de email
    const emailValidation = LoginSecurityService.validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ success: false, message: emailValidation.message });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Contraseña es requerida' });
    }

    // Obtener IP del cliente
    const clientIp = LoginSecurityService.getClientIp(req);

    // Verificar si puede intentar login (rate limiting y bloqueos)
    const securityCheck = await LoginSecurityService.canAttemptLogin(email, clientIp);
    if (!securityCheck.allowed) {
      await AuditService.log({
        churchId: null as any,
        userId: null as any,
        userEmail: email,
        userName: 'Unknown',
        userRole: 'VIEWER',
        action: AuditAction.LOGIN_FAILED,
        category: AuditCategory.AUTH,
        resourceType: 'Auth',
        success: false,
        errorMessage: securityCheck.message || 'Cuenta bloqueada',
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
        severity: AuditSeverity.WARNING,
      });

      return res.status(429).json({ 
        success: false, 
        message: securityCheck.message,
        blockedUntil: securityCheck.blockedUntil,
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      // Registrar intento fallido
      await LoginSecurityService.recordFailedAttempt(email, clientIp);
      
      await AuditService.log({
        churchId: null as any,
        userId: null as any,
        userEmail: email,
        userName: 'Unknown',
        userRole: 'VIEWER',
        action: AuditAction.LOGIN_FAILED,
        category: AuditCategory.AUTH,
        resourceType: 'Auth',
        success: false,
        errorMessage: 'Usuario no encontrado',
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
        severity: AuditSeverity.WARNING,
      });

      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Verificar si la cuenta del usuario está bloqueada por intentos fallidos
    if (user.lockUntil && new Date() < user.lockUntil) {
      const minutesRemaining = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({ 
        success: false, 
        message: `Cuenta bloqueada por demasiados intentos fallidos. Intente en ${minutesRemaining} minuto(s) o contacte al administrador.`,
        locked: true,
        lockUntil: user.lockUntil,
      });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      // Registrar intento fallido (rate limiter global)
      await LoginSecurityService.recordFailedAttempt(email, clientIp);

      // Incrementar contador de intentos fallidos del usuario
      const MAX_USER_ATTEMPTS = 5;
      const LOCK_DURATION_MINUTES = 30;
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      if (user.failedLoginAttempts >= MAX_USER_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      }
      await user.save();

      const attemptsRemaining = MAX_USER_ATTEMPTS - user.failedLoginAttempts;

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
        errorMessage: user.failedLoginAttempts >= MAX_USER_ATTEMPTS 
          ? `Cuenta bloqueada tras ${MAX_USER_ATTEMPTS} intentos fallidos`
          : `Contraseña incorrecta (intento ${user.failedLoginAttempts}/${MAX_USER_ATTEMPTS})`,
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
        severity: user.failedLoginAttempts >= MAX_USER_ATTEMPTS ? AuditSeverity.CRITICAL : AuditSeverity.WARNING,
      });

      if (user.failedLoginAttempts >= MAX_USER_ATTEMPTS) {
        return res.status(423).json({ 
          success: false, 
          message: `Cuenta bloqueada por ${LOCK_DURATION_MINUTES} minutos tras ${MAX_USER_ATTEMPTS} intentos fallidos. Contacte al administrador.`,
          locked: true,
          lockUntil: user.lockUntil,
        });
      }

      return res.status(401).json({ 
        success: false, 
        message: attemptsRemaining > 0 
          ? `Credenciales inválidas. ${attemptsRemaining} intento(s) restante(s).`
          : 'Credenciales inválidas',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Usuario desactivado. Contacte al administrador.' });
    }

    // Limpiar intentos fallidos tras login exitoso
    await LoginSecurityService.clearAttempts(email, clientIp);

    // Resetear contador de intentos fallidos del usuario
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
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
      ipAddress: clientIp,
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
          isSuperUser: user.isSuperUser || false,
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
        isSuperUser: user.isSuperUser || false,
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

/**
 * Solicitar recuperación de contraseña
 * Genera un token y envía email (o lo devuelve si no hay email configurado)
 */
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'El email es requerido' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Siempre responder exitosamente para no revelar si el email existe
    if (!user) {
      return res.json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
      });
    }

    if (!user.isActive) {
      return res.json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
      });
    }

    // Generar token aleatorio
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Guardar token hasheado y expiración (1 hora)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Construir URL de reset
    const resetUrl = `${envConfig.frontendUrl}/reset-password/${resetToken}`;

    // Intentar enviar email
    try {
      const nodemailer = await import('nodemailer');
      const emailFrom = process.env.EMAIL_FROM;
      const emailFromName = process.env.EMAIL_FROM_NAME || 'Church Program Manager';

      if (emailFrom) {
        // Función para crear transporter
        let transporter;
        const provider = process.env.EMAIL_PROVIDER || 'smtp';

        if (provider === 'sendgrid') {
          transporter = nodemailer.default.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY },
          });
        } else if (provider === 'mailtrap') {
          transporter = nodemailer.default.createTransport({
            host: 'smtp.mailtrap.io',
            port: 2525,
            auth: { user: process.env.MAILTRAP_USER || '', pass: process.env.MAILTRAP_PASS || '' },
          });
        } else {
          transporter = nodemailer.default.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' },
          });
        }

        await transporter.sendMail({
          from: `"${emailFromName}" <${emailFrom}>`,
          to: user.email,
          subject: '🔐 Restablecer contraseña - Church Program Manager',
          html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f0f4f8;margin:0;padding:20px;">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0e1b33,#1a2d52);padding:28px 24px;text-align:center;">
    <div style="font-size:32px;margin-bottom:8px;">🔐</div>
    <h1 style="color:#d4b86a;margin:0;font-size:18px;font-weight:600;">Restablecer Contraseña</h1>
  </div>
  <div style="padding:28px 24px;">
    <p style="color:#333;font-size:15px;">Hola <strong>${user.fullName}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.6;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
      Haz clic en el botón de abajo para crear una nueva contraseña:
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#c49a30,#dbb854);color:#0a0e1a;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.5px;">
        Restablecer Contraseña
      </a>
    </div>
    <p style="color:#888;font-size:12px;line-height:1.5;">
      Este enlace expirará en <strong>1 hora</strong>.<br/>
      Si no solicitaste este cambio, puedes ignorar este mensaje.
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
    <p style="color:#aaa;font-size:11px;text-align:center;">
      Church Program Manager · Este es un mensaje automático
    </p>
  </div>
</div>
</body>
</html>`,
        });

        console.info(`[Auth] Password reset email sent to ${user.email}`);
      } else {
        console.warn('[Auth] EMAIL_FROM not configured, password reset email skipped');
      }
    } catch (emailError) {
      console.error('[Auth] Failed to send password reset email:', emailError);
      // No fallar si el email no se pudo enviar
    }

    // Audit log
    await AuditService.log({
      churchId: user.churchId,
      userId: user._id,
      userEmail: user.email,
      userName: user.fullName,
      userRole: user.role,
      action: AuditAction.PASSWORD_CHANGE,
      category: AuditCategory.AUTH,
      resourceType: 'Auth',
      success: true,
      metadata: { action: 'password_reset_requested' },
    });

    res.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
    });
  } catch (error: any) {
    console.error('RequestPasswordReset error:', error);
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
};

/**
 * Verificar si un token de reset es válido
 */
export const verifyResetToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'El enlace es inválido o ha expirado. Solicita uno nuevo.',
      });
    }

    res.json({
      success: true,
      data: { email: user.email, fullName: user.fullName },
    });
  } catch (error: any) {
    console.error('VerifyResetToken error:', error);
    res.status(500).json({ success: false, message: 'Error al verificar el token' });
  }
};

/**
 * Restablecer contraseña con token
 */
export const resetPasswordWithToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +passwordHash');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'El enlace es inválido o ha expirado. Solicita uno nuevo.',
      });
    }

    // Actualizar contraseña y limpiar token
    user.passwordHash = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Limpiar intentos de login
    try {
      const LoginAttempt = (await import('../../models/LoginAttempt.model')).default;
      await LoginAttempt.deleteMany({ email: user.email.toLowerCase() });
    } catch (e) {
      // Silencioso
    }

    // Audit log
    await AuditService.log({
      churchId: user.churchId,
      userId: user._id,
      userEmail: user.email,
      userName: user.fullName,
      userRole: user.role,
      action: AuditAction.PASSWORD_CHANGE,
      category: AuditCategory.AUTH,
      resourceType: 'Auth',
      success: true,
      metadata: { action: 'password_reset_completed', method: 'token' },
      severity: AuditSeverity.WARNING,
    });

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.',
    });
  } catch (error: any) {
    console.error('ResetPasswordWithToken error:', error);
    res.status(500).json({ success: false, message: 'Error al restablecer la contraseña' });
  }
};

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
    
    // Normalizar email (trim y lowercase) para comparaciones consistentes
    const normalizedEmail = email ? email.trim().toLowerCase() : '';

    console.log('[REGISTER] Intento de registro:', { 
      emailOriginal: email,
      emailNormalizado: normalizedEmail, 
      hasPassword: !!password, 
      name, 
      role, 
      churchId 
    });

    // Validar email
    const emailValidation = LoginSecurityService.validateEmail(normalizedEmail);
    if (!emailValidation.valid) {
      console.log('[REGISTER] Validación email falló:', emailValidation.message);
      return res.status(400).json({ success: false, message: emailValidation.message });
    }

    // Validar contraseña
    const passwordValidation = LoginSecurityService.validatePassword(password);
    if (!passwordValidation.valid) {
      console.log('[REGISTER] Validación password falló:', passwordValidation.message);
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    if (!name) {
      console.log('[REGISTER] Nombre faltante');
      return res.status(400).json({ success: false, message: 'Nombre es requerido' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // VALIDACIÓN ESPECIAL PARA SUPERUSUARIO admin@iglesia.com
      // No permitir NINGÚN re-registro del superusuario (ni siquiera si no está verificado)
      if (normalizedEmail === 'admin@iglesia.com') {
        console.log('[REGISTER] ⛔ Intento de re-registro de admin@iglesia.com bloqueado');
        return res.status(400).json({ 
          success: false, 
          message: 'El superusuario admin@iglesia.com ya existe en el sistema. Si olvidaste tu contraseña, usa la opción de recuperación.' 
        });
      }
      
      // Para usuarios normales: Si el usuario existe pero NO está verificado, permitir re-registro
      if (!existingUser.isEmailVerified) {
        console.log('[REGISTER] Usuario existe pero no verificado, eliminando registro anterior:', normalizedEmail);
        await User.deleteOne({ _id: existingUser._id });
        console.log('[REGISTER] Usuario anterior eliminado, procediendo con nuevo registro...');
      } else {
        console.log('[REGISTER] Usuario ya existe y está verificado:', normalizedEmail);
        return res.status(400).json({ success: false, message: 'El usuario ya existe' });
      }
    } else {
      console.log('[REGISTER] Usuario nuevo, procediendo a crear...');
    }

    // DETECCIÓN DE SUPERUSUARIO (debe hacerse ANTES de determinar rol)
    const isSuperAdminEmail = normalizedEmail === 'admin@iglesia.com';
    
    // Determinar el rol: si no se especifica, usar VIEWER (registros públicos)
    // EXCEPCIÓN: admin@iglesia.com siempre es SUPER_ADMIN
    // Solo permitir especificar rol diferente si viene de un admin autenticado
    let finalRole = 'VIEWER';
    if (isSuperAdminEmail) {
      finalRole = 'SUPER_ADMIN';
      console.log('[REGISTER] 🔑 SUPERUSUARIO DETECTADO: asignando rol SUPER_ADMIN');
    } else if (role && (req as any).user) {
      // Si hay un usuario autenticado, puede especificar el rol
      finalRole = role;
    }

    // Para SUPER_ADMIN o ADMIN, crear iglesia por defecto si no se proporciona
    let finalChurchId = churchId;
    if ((finalRole === 'SUPER_ADMIN' || finalRole === 'ADMIN') && !finalChurchId) {
      // Importar Church model
      const Church = (await import('../../models/Church.model')).default;
      
      // Crear iglesia por defecto para admin
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

    // Si es VIEWER y no hay churchId, asignar la primera iglesia activa disponible
    if (finalRole === 'VIEWER' && !finalChurchId) {
      const Church = (await import('../../models/Church.model')).default;
      let defaultChurch = await Church.findOne({ isActive: true }).limit(1);
      
      // Si no hay ninguna iglesia, crear una por defecto (primer usuario del sistema)
      if (!defaultChurch) {
        defaultChurch = new Church({
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
        console.log('Iglesia por defecto creada automáticamente para primer usuario VIEWER');
      }
      
      finalChurchId = defaultChurch._id;
    }

    // Determinar si es registro público (requiere verificación de email)
    // EXCEPCIÓN: admin@iglesia.com (superusuario) nunca requiere verificación
    const isPublicRegistration = !role && !(req as any).user && !isSuperAdminEmail;
    
    if (isSuperAdminEmail) {
      console.log('[REGISTER] ✅ SUPERUSUARIO DETECTADO: admin@iglesia.com - OMITIENDO VERIFICACIÓN DE EMAIL');
    } else {
      console.log('[REGISTER] Tipo registro:', isPublicRegistration ? 'PÚBLICO (con verificación)' : 'ADMIN (sin verificación)');
    }

    // Generar token de verificación de email para registros públicos
    let verificationToken = '';
    if (isPublicRegistration) {
      verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
      
      console.log('[REGISTER] Creando usuario inactivo, churchId:', finalChurchId);

      // Crear nuevo usuario (inactivo hasta verificar email)
      const newUser = new User({
        email: normalizedEmail,
        passwordHash: password, // El pre-save hook lo hasheará
        fullName: name,
        role: finalRole,
        churchId: finalChurchId,
        isActive: false, // Inactivo hasta verificar email
        isEmailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 horas (3 días)
      });

      await newUser.save();
      console.log('[REGISTER] Usuario creado exitosamente, enviando email de verificación...');

      // ─── VINCULACIÓN INTELIGENTE CON PERSON ───────────────────────────────
      // Buscar Person existente por similaridad de nombre
      const Person = (await import('../../models/Person.model')).default;
      const existingPerson = await findPersonByNameSimilarity(name, finalChurchId, Person);
      
      let linkedPersonId: any = null;
      let createdNewPerson = false;
      
      if (existingPerson && !existingPerson.userId) {
        // Vincular Person existente con el nuevo User
        existingPerson.userId = newUser._id;
        existingPerson.email = newUser.email;  // Actualizar email
        await existingPerson.save();
        linkedPersonId = existingPerson._id;
        console.log(`[REGISTER] Person existente vinculada: ${existingPerson.fullName} (${existingPerson._id})`);
      } else if (!existingPerson) {
        // Crear nueva Person automáticamente
        const newPerson = new Person({
          churchId: finalChurchId,
          userId: newUser._id,
          fullName: name,
          email: newUser.email,
          ministry: 'General',  // Ministerio por defecto
          status: 'ACTIVO',
          priority: 5,
          roles: [],
        });
        await newPerson.save();
        linkedPersonId = newPerson._id;
        createdNewPerson = true;
        console.log(`[REGISTER] Nueva Person creada automáticamente: ${newPerson.fullName} (${newPerson._id})`);
      } else {
        console.log('[REGISTER] Person encontrada ya tiene User vinculado, no se vincula');
      }

      // Enviar email de verificación (con rollback si falla)
      try {
        await sendVerificationEmail(newUser.email, newUser.fullName, verificationToken);
        console.log('[REGISTER] Email de verificación enviado exitosamente');
      } catch (emailError: any) {
        console.error('[REGISTER] Error enviando email, haciendo rollback completo:', emailError.message);
        
        // Rollback: eliminar el usuario
        await User.deleteOne({ _id: newUser._id });
        
        // Rollback: limpiar vinculación o eliminar Person creada
        if (linkedPersonId) {
          if (createdNewPerson) {
            // Eliminar Person recién creada
            await Person.deleteOne({ _id: linkedPersonId });
            console.log('[REGISTER] Person creada eliminada en rollback');
          } else {
            // Desvincular Person existente
            await Person.updateOne(
              { _id: linkedPersonId }, 
              { $unset: { userId: '', email: '' } }
            );
            console.log('[REGISTER] Person desvinculada en rollback');
          }
        }
        
        return res.status(500).json({
          success: false,
          message: 'Error al enviar el email de verificación. Por favor, intenta de nuevo en unos minutos.',
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Registro exitoso. Por favor verifica tu email para activar tu cuenta.',
        data: {
          emailSent: true,
          email: newUser.email,
        },
      });
    }

    // Crear nuevo usuario (admin creando usuario o superusuario - sin verificación)
    console.log('[REGISTER] ⚡ Creando usuario SIN verificación de email, activo inmediatamente');
    console.log('[REGISTER] Es superadmin:', isSuperAdminEmail);
    
    const newUser = new User({
      email: normalizedEmail,
      passwordHash: password, // El pre-save hook lo hasheará
      fullName: name,
      role: finalRole,
      churchId: finalChurchId,
      isActive: true,
      isEmailVerified: true, // Los usuarios creados por admin o superusuario ya están verificados
    });

    await newUser.save();
    console.log(`[REGISTER] Usuario creado y activado: ${newUser.email} (rol: ${newUser.role})`);

    // ─── VINCULACIÓN INTELIGENTE CON PERSON (usuarios creados por admin) ───
    const Person = (await import('../../models/Person.model')).default;
    const existingPerson = await findPersonByNameSimilarity(name, finalChurchId, Person);
    
    if (existingPerson && !existingPerson.userId) {
      existingPerson.userId = newUser._id;
      existingPerson.email = newUser.email;
      await existingPerson.save();
      console.log(`[REGISTER ADMIN] Person existente vinculada: ${existingPerson.fullName}`);
    } else if (!existingPerson) {
      const newPerson = new Person({
        churchId: finalChurchId,
        userId: newUser._id,
        fullName: name,
        email: newUser.email,
        ministry: 'General',
        status: 'ACTIVO',
        priority: 5,
        roles: [],
      });
      await newPerson.save();
      console.log(`[REGISTER ADMIN] Nueva Person creada: ${newPerson.fullName}`);
    }

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

      return res.status(401).json({ success: false, message: 'Este correo no está registrado', field: 'email' });
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
        field: 'password',
        message: attemptsRemaining > 0 
          ? `Contraseña incorrecta. ${attemptsRemaining} intento(s) restante(s).`
          : 'Contraseña incorrecta',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Usuario desactivado. Contacte al administrador.' });
    }

    // Verificar si el email ha sido verificado
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.',
        emailNotVerified: true,
        email: user.email,
      });
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

/**
 * Función auxiliar para buscar Person por similaridad de nombre
 * Retorna la Person con mayor similaridad si supera el 80% de coincidencia
 */
async function findPersonByNameSimilarity(
  fullName: string, 
  churchId: any, 
  PersonModel: any
): Promise<any | null> {
  try {
    // Normalizar el nombre de entrada
    const normalizedInput = normalizeNameForComparison(fullName);
    const inputWords = normalizedInput.split(' ').filter(w => w.length > 2);
    
    if (inputWords.length === 0) return null;

    // Obtener todas las personas activas de la iglesia sin userId asignado
    const persons = await PersonModel.find({ 
      churchId, 
      status: { $in: ['ACTIVO', 'ACTIVE'] },
      userId: { $exists: false }  // Solo buscar personas sin usuario vinculado
    }).select('fullName');

    if (persons.length === 0) return null;

    let bestMatch: any = null;
    let bestScore = 0;

    // Comparar cada persona
    for (const person of persons) {
      const normalizedPerson = normalizeNameForComparison(person.fullName);
      const personWords = normalizedPerson.split(' ').filter(w => w.length > 2);
      
      // Calcular similaridad basada en palabras coincidentes
      const score = calculateNameSimilarity(inputWords, personWords);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = person;
      }
    }

    // Solo retornar si la similaridad es mayor al 80%
    if (bestScore >= 0.80) {
      console.log(`[MATCH] Coincidencia encontrada: "${fullName}" ↔ "${bestMatch.fullName}" (${Math.round(bestScore * 100)}%)`);
      return bestMatch;
    }

    console.log(`[MATCH] No se encontró coincidencia suficiente para: "${fullName}" (mejor: ${Math.round(bestScore * 100)}%)`);
    return null;
  } catch (error) {
    console.error('[MATCH] Error buscando persona por nombre:', error);
    return null;
  }
}

/**
 * Normalizar nombre para comparación (quitar acentos, lowercase, espacios extra)
 */
function normalizeNameForComparison(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
    .replace(/\s+/g, ' ') // Espacios múltiples a uno
    .trim();
}

/**
 * Calcular similaridad entre dos conjuntos de palabras
 * Retorna un score entre 0 y 1
 */
function calculateNameSimilarity(words1: string[], words2: string[]): number {
  if (words1.length === 0 || words2.length === 0) return 0;

  // Contar palabras coincidentes
  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      // Coincidencia exacta o una palabra contiene la otra
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matches++;
        break;
      }
    }
  }

  // Score basado en el promedio de coincidencias sobre ambos conjuntos
  const score1 = matches / words1.length;
  const score2 = matches / words2.length;
  return (score1 + score2) / 2;
}

/**
 * Función auxiliar para enviar email de verificación
 */
async function sendVerificationEmail(email: string, fullName: string, token: string) {
  try {
    const emailFrom = process.env.EMAIL_FROM;
    const emailFromName = process.env.EMAIL_FROM_NAME || 'Church Program Manager';

    if (!emailFrom) {
      console.warn('Email no configurado - Token de verificación:', token);
      return;
    }

    const verifyUrl = `${envConfig.frontendUrl}/verify-email/${token}`;
    const provider = process.env.EMAIL_PROVIDER || 'smtp';
    const smtpHost = process.env.SMTP_HOST || '';

    // Detectar si es Brevo y usar su API REST (más confiable que SMTP en plataformas cloud)
    const isBrevo = provider === 'brevo' || smtpHost.includes('brevo.com') || smtpHost.includes('sendinblue');
    
    if (isBrevo && process.env.BREVO_API_KEY) {
      // Usar API REST de Brevo (puerto 443, nunca bloqueado)
      const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verificación de Email - Church Program Manager</title>
</head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;line-height:1.6;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Verificación de Email</h1>
  </div>
  
  <!-- Body -->
  <div style="padding:32px 24px;">
    <p style="color:#333333;font-size:16px;margin:0 0 16px;">Hola <strong>${fullName}</strong>,</p>
    
    <p style="color:#555555;font-size:14px;margin:0 0 24px;">
      Gracias por registrarte en Church Program Manager. Para activar tu cuenta y comenzar a usar 
      nuestro sistema de gestión de programas para iglesias, necesitamos verificar tu dirección de email.
    </p>
    
    <p style="color:#555555;font-size:14px;margin:0 0 24px;">
      Por favor, haz clic en el siguiente botón para confirmar tu email:
    </p>
    
    <!-- CTA Button -->
    <div style="text-align:center;margin:32px 0;">
      <a href="${verifyUrl}" 
         style="display:inline-block;
                background:#3b82f6;
                color:#ffffff;
                padding:14px 40px;
                border-radius:6px;
                text-decoration:none;
                font-weight:600;
                font-size:15px;">
        Verificar mi Email
      </a>
    </div>
    
    <!-- Alternative Link -->
    <p style="color:#888888;font-size:12px;margin:24px 0 0;text-align:center;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
      <a href="${verifyUrl}" style="color:#3b82f6;word-break:break-all;">${verifyUrl}</a>
    </p>
    
    <!-- Security Info -->
    <div style="background:#f8fafc;border-left:3px solid#3b82f6;padding:16px;margin:24px 0;border-radius:4px;">
      <p style="color:#64748b;font-size:13px;margin:0;">
        <strong>Información de Seguridad:</strong><br/>
        Este enlace expirará en 24 horas por seguridad.<br/>
        Si no creaste esta cuenta, puedes ignorar este mensaje de forma segura.
      </p>
    </div>
    
  </div>
  
  <!-- Footer -->
  <div style="background:#f8fafc;padding:24px;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;text-align:center;">
      <strong>Church Program Manager</strong><br/>
      Sistema profesional de gestión de programas para iglesias
    </p>
    <p style="color:#cbd5e1;font-size:11px;margin:0;text-align:center;">
      Este es un email transaccional automático. Por favor no respondas a este mensaje.<br/>
      © ${new Date().getFullYear()} Church Program Manager. Todos los derechos reservados.
    </p>
  </div>
  
</div>
</body>
</html>`;

      // Texto plano como fallback (mejora deliverability)
      const textContent = `
Hola ${fullName},

Gracias por registrarte en Church Program Manager.

Para activar tu cuenta, verifica tu email haciendo clic en el siguiente enlace:
${verifyUrl}

Este enlace expirará en 24 horas.

Si no creaste esta cuenta, puedes ignorar este mensaje.

---
Church Program Manager
Sistema de gestión de programas para iglesias
© ${new Date().getFullYear()} Todos los derechos reservados
`;

      // Usar API REST de Brevo con módulo https nativo (compatible con todas las versiones de Node.js)
      const https = await import('https');
      
      const postData = JSON.stringify({
        sender: { name: emailFromName, email: emailFrom },
        to: [{ email, name: fullName }],
        subject: 'Verifica tu cuenta - Church Program Manager',
        htmlContent,
        textContent,  // Versión texto plano (mejora deliverability)
        // Configuraciones anti-SPAM
        headers: {
          'X-Mailer': 'Church Program Manager',
          'List-Unsubscribe': `<mailto:${emailFrom}?subject=unsubscribe>`,
        },
        tags: ['email-verification', 'transactional']
      });

      const options = {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(postData),
        },
      };

      await new Promise<void>((resolve, reject) => {
        const req = https.default.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`Email de verificación enviado a: ${email} (vía Brevo API)`);
              resolve();
            } else {
              reject(new Error(`Brevo API error: ${res.statusCode} - ${data}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(new Error(`Brevo API request failed: ${error.message}`));
        });

        req.write(postData);
        req.end();
      });
      
      return;
    }

    // Usar nodemailer para otros proveedores (SMTP)
    const nodemailer = await import('nodemailer');
    let transporter;

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
      to: email,
      subject: '✅ Verifica tu email - Church Program Manager',
      html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f0f4f8;margin:0;padding:20px;">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0e1b33,#1a2d52);padding:28px 24px;text-align:center;">
    <div style="font-size:32px;margin-bottom:8px;">✅</div>
    <h1 style="color:#d4b86a;margin:0;font-size:18px;font-weight:600;">Verifica tu Email</h1>
  </div>
  <div style="padding:28px 24px;">
    <p style="color:#333;font-size:15px;">Hola <strong>${fullName}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.6;">
      ¡Bienvenido a Church Program Manager! Para completar tu registro y activar tu cuenta, 
      por favor verifica tu dirección de email haciendo clic en el botón de abajo:
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#c49a30,#dbb854);color:#0a0e1a;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.5px;">
        Verificar Email
      </a>
    </div>
    <p style="color:#888;font-size:12px;line-height:1.5;">
      Este enlace expirará en <strong>24 horas</strong>.<br/>
      Si no creaste esta cuenta, puedes ignorar este mensaje.
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

    console.log('Email de verificación enviado a:', email);
  } catch (error) {
    console.error('Error enviando email de verificación:', error);
    throw error;
  }
}

/**
 * Verificar email con token
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificación requerido',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuario con el token (sin importar si expiró)
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'El enlace de verificación es inválido.',
        error: 'INVALID_TOKEN'
      });
    }

    // Verificar si el token expiró
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'El enlace de verificación ha expirado. Te enviaremos un nuevo correo.',
        error: 'TOKEN_EXPIRED',
        data: {
          email: user.email,
          canResend: true
        }
      });
    }

    // Activar usuario y marcar email como verificado
    user.isEmailVerified = true;
    user.isActive = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Generar token de acceso
    const accessToken = jwt.sign(
      { id: user._id, role: user.role, churchId: user.churchId },
      envConfig.jwtSecret,
      { expiresIn: '1d' }
    );

    const permissions = user.getEffectivePermissions();

    // Audit log
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
      metadata: { action: 'email_verified' },
      severity: AuditSeverity.INFO,
    });

    res.json({
      success: true,
      message: 'Email verificado exitosamente. ¡Bienvenido!',
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
    console.error('VerifyEmail error:', error);
    res.status(500).json({ success: false, message: 'Error al verificar el email' });
  }
};

/**
 * Reenviar email de verificación
 */
/**
 * PUT /auth/callmebot
 * Guardar o actualizar la configuración de CallMeBot del usuario.
 */
export const updateCallMeBot = async (req: AuthRequest, res: Response) => {
  try {
    const { callMeBotPhone, callMeBotApiKey, notifyBirthdays, additionalRecipients } = req.body;

    const user = await User.findById(req.userId).select('+callMeBotApiKey +additionalRecipients');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (callMeBotPhone  !== undefined) user.callMeBotPhone  = callMeBotPhone?.trim()  || undefined;
    if (callMeBotApiKey !== undefined) user.callMeBotApiKey = callMeBotApiKey?.trim() || undefined;
    if (notifyBirthdays !== undefined) user.notifyBirthdays = Boolean(notifyBirthdays);
    if (Array.isArray(additionalRecipients)) {
      // Filtrar entradas válidas (debe tener phone y apiKey al menos)
      user.additionalRecipients = additionalRecipients
        .filter((r: any) => r.phone?.trim() && r.apiKey?.trim())
        .map((r: any) => ({
          name:   (r.name  || '').trim(),
          phone:  r.phone.trim(),
          apiKey: r.apiKey.trim(),
        }));
    }

    await user.save();

    res.json({
      success: true,
      message: 'Configuración de WhatsApp guardada',
      data: {
        callMeBotPhone:       user.callMeBotPhone,
        notifyBirthdays:      user.notifyBirthdays,
        configured:           !!(user.callMeBotPhone && user.callMeBotApiKey),
        additionalRecipients: (user.additionalRecipients || []).map(r => ({ name: r.name, phone: r.phone })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /auth/callmebot
 * Obtener el estado de configuración CallMeBot del usuario (sin exponer el apiKey).
 */
export const getCallMeBotConfig = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('+callMeBotApiKey +additionalRecipients');
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    res.json({
      success: true,
      data: {
        callMeBotPhone:       user.callMeBotPhone  || '',
        notifyBirthdays:      user.notifyBirthdays !== false,
        configured:           !!(user.callMeBotPhone && user.callMeBotApiKey),
        hasApiKey:            !!user.callMeBotApiKey,
        // Retorna nombre y teléfono de adicionales pero NO las apiKeys
        additionalRecipients: (user.additionalRecipients || []).map(r => ({ name: r.name, phone: r.phone })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'El email es requerido' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // No revelar si el usuario existe
      return res.json({
        success: true,
        message: 'Si el email existe y no está verificado, recibirás un nuevo enlace de verificación.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya ha sido verificado. Puedes iniciar sesión.',
      });
    }

    // Generar nuevo token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 horas (3 días)
    await user.save();

    // Enviar email
    await sendVerificationEmail(user.email, user.fullName, verificationToken);

    res.json({
      success: true,
      message: 'Email de verificación reenviado. Revisa tu bandeja de entrada.',
    });
  } catch (error: any) {
    console.error('ResendVerificationEmail error:', error);
    res.status(500).json({ success: false, message: 'Error al reenviar el email de verificación' });
  }
};

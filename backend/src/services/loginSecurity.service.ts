import LoginAttempt from '../models/LoginAttempt.model';

interface LoginSecurityResult {
  allowed: boolean;
  message?: string;
  attemptsRemaining?: number;
  blockedUntil?: Date;
}

export class LoginSecurityService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly BLOCK_DURATION_MINUTES = 15;
  private static readonly RESET_ATTEMPTS_MINUTES = 60;

  /**
   * Verifica si un usuario/IP puede intentar login
   */
  static async canAttemptLogin(email: string, ipAddress: string): Promise<LoginSecurityResult> {
    const attempt = await LoginAttempt.findOne({ 
      email: email.toLowerCase(), 
      ipAddress 
    });

    // Si no hay registro, permitir
    if (!attempt) {
      return { allowed: true };
    }

    // Verificar si está bloqueado
    if (attempt.isBlocked && attempt.blockedUntil) {
      if (new Date() < attempt.blockedUntil) {
        const minutesRemaining = Math.ceil((attempt.blockedUntil.getTime() - Date.now()) / 60000);
        return {
          allowed: false,
          message: `Cuenta bloqueada temporalmente. Intente nuevamente en ${minutesRemaining} minuto(s).`,
          blockedUntil: attempt.blockedUntil,
        };
      } else {
        // Desbloquear si ya pasó el tiempo
        attempt.isBlocked = false;
        attempt.blockedUntil = undefined;
        attempt.attempts = 0;
        await attempt.save();
        return { allowed: true };
      }
    }

    // Verificar si debe resetear intentos (después de 1 hora sin intentos)
    const timeSinceLastAttempt = Date.now() - attempt.lastAttempt.getTime();
    const resetTimeMs = this.RESET_ATTEMPTS_MINUTES * 60 * 1000;
    
    if (timeSinceLastAttempt > resetTimeMs) {
      attempt.attempts = 0;
      await attempt.save();
    }

    // Verificar número de intentos
    if (attempt.attempts >= this.MAX_ATTEMPTS) {
      // Bloquear cuenta
      attempt.isBlocked = true;
      attempt.blockedUntil = new Date(Date.now() + this.BLOCK_DURATION_MINUTES * 60 * 1000);
      await attempt.save();

      return {
        allowed: false,
        message: `Demasiados intentos fallidos. Cuenta bloqueada por ${this.BLOCK_DURATION_MINUTES} minutos.`,
        blockedUntil: attempt.blockedUntil,
      };
    }

    // Permitir intento
    const remaining = this.MAX_ATTEMPTS - attempt.attempts;
    return { 
      allowed: true, 
      attemptsRemaining: remaining 
    };
  }

  /**
   * Registra un intento de login fallido
   */
  static async recordFailedAttempt(email: string, ipAddress: string): Promise<void> {
    const attempt = await LoginAttempt.findOne({ 
      email: email.toLowerCase(), 
      ipAddress 
    });

    if (attempt) {
      attempt.attempts += 1;
      attempt.lastAttempt = new Date();
      await attempt.save();
    } else {
      await LoginAttempt.create({
        email: email.toLowerCase(),
        ipAddress,
        attempts: 1,
        lastAttempt: new Date(),
      });
    }
  }

  /**
   * Limpia intentos tras login exitoso
   */
  static async clearAttempts(email: string, ipAddress: string): Promise<void> {
    await LoginAttempt.deleteOne({ 
      email: email.toLowerCase(), 
      ipAddress 
    });
  }

  /**
   * Valida formato de email
   */
  static validateEmail(email: string): { valid: boolean; message?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, message: 'Email es requerido' };
    }

    // Regex más estricto para email
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Formato de email inválido' };
    }

    if (email.length > 255) {
      return { valid: false, message: 'Email demasiado largo' };
    }

    return { valid: true };
  }

  /**
   * Valida contraseña (para registro)
   */
  static validatePassword(password: string): { valid: boolean; message?: string } {
    if (!password || typeof password !== 'string') {
      return { valid: false, message: 'Contraseña es requerida' };
    }

    if (password.length < 8) {
      return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }

    if (password.length > 128) {
      return { valid: false, message: 'La contraseña es demasiado larga' };
    }

    // Verificar complejidad
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const complexityCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (complexityCount < 3) {
      return {
        valid: false,
        message: 'La contraseña debe contener al menos 3 de los siguientes: mayúsculas, minúsculas, números, caracteres especiales',
      };
    }

    // Verificar que no sea común
    const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein', 'welcome'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      return { valid: false, message: 'La contraseña es demasiado común' };
    }

    return { valid: true };
  }

  /**
   * Extrae IP del request (considerando proxies)
   */
  static getClientIp(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }
}

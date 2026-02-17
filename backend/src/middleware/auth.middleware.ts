import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import envConfig from '../config/env';
import User, { IUser } from '../models/User.model';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  userRole?: string;
  isSuperUser?: boolean;
  churchId?: string;
  churchPlan?: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, envConfig.jwtSecret) as {
      id: string;
      role: string;
    };

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Usuario no encontrado o inactivo');
    }

    req.user = user;
    req.userId = user._id.toString();
    req.userRole = user.role;
    req.isSuperUser = user.isSuperUser || false;
    req.churchId = user.churchId.toString();

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new ForbiddenError('No tienes permisos para esta acción'));
    }
    next();
  };
};

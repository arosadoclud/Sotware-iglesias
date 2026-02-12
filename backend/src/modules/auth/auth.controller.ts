import { Request, Response } from 'express';
import User from '../../models/User.model';
import jwt from 'jsonwebtoken';
import envConfig from '../../config/env';

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
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken = jwt.sign(
      { id: user._id, role: user.role, churchId: user.churchId },
      envConfig.jwtSecret,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          churchId: user.churchId,
        },
        accessToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};

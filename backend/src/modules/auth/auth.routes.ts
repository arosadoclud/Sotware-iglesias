import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword, requestPasswordReset, verifyResetToken, resetPasswordWithToken, verifyEmail, resendVerificationEmail, updateCallMeBot, getCallMeBotConfig } from './auth.controller';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../../models/User.model';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
const avatarDir = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(avatarDir, { recursive: true });
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: avatarDir,
    filename: (req, file, callback) => callback(null, `${(req as AuthRequest).userId}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
  }),
  fileFilter: (req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) && ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file.originalname).toLowerCase())),
  limits: { fileSize: 2 * 1024 * 1024 }
});
router.post('/avatar', authenticate, avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Selecciona una imagen JPG, PNG o WebP de hasta 2 MB' });
    const user = await User.findById((req as AuthRequest).userId);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const oldAvatar = user.avatarUrl;
    user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.save();
    if (oldAvatar?.startsWith('/uploads/avatars/')) {
      fs.promises.unlink(path.join(avatarDir, path.basename(oldAvatar))).catch(() => {});
    }
    res.json({ success: true, data: { avatarUrl: user.avatarUrl } });
  } catch (error) { next(error); }
});
router.put('/change-password', authenticate, changePassword);

// CallMeBot WhatsApp notifications
router.get('/callmebot', authenticate, getCallMeBotConfig);
router.put('/callmebot', authenticate, updateCallMeBot);

// Password reset (public)
router.post('/forgot-password', requestPasswordReset);
router.get('/reset-password/:token', verifyResetToken);
router.post('/reset-password/:token', resetPasswordWithToken);

// Email verification (public)
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

export default router;

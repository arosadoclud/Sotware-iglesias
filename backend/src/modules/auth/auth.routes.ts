import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword, requestPasswordReset, verifyResetToken, resetPasswordWithToken } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

// Password reset (public)
router.post('/forgot-password', requestPasswordReset);
router.get('/reset-password/:token', verifyResetToken);
router.post('/reset-password/:token', resetPasswordWithToken);

export default router;

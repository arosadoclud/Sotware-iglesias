import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword, requestPasswordReset, verifyResetToken, resetPasswordWithToken, verifyEmail, resendVerificationEmail, updateCallMeBot, getCallMeBotConfig } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
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

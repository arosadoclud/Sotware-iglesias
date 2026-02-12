import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { getMyChurch, updateMyChurch } from './church.controller';

const router = Router();

router.use(authenticate);
router.get('/mine', getMyChurch);
router.put('/mine', authorize('ADMIN'), updateMyChurch);

export default router;

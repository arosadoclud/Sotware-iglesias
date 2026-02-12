import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { getMinistries, createMinistry } from './ministry.controller';

const router = Router();
router.use(authenticate);

router.get('/', getMinistries);
router.post('/', authorize('ADMIN', 'EDITOR'), createMinistry);

export default router;

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { getMinistries, createMinistry, updateMinistry, deleteMinistry, seedDefaultMinistries } from './ministry.controller';

const router = Router();
router.use(authenticate);

router.get('/', getMinistries);
router.post('/', authorize('ADMIN', 'EDITOR'), createMinistry);
router.post('/seed', authorize('ADMIN', 'EDITOR'), seedDefaultMinistries);
router.put('/:id', authorize('ADMIN', 'EDITOR'), updateMinistry);
router.delete('/:id', authorize('ADMIN', 'EDITOR'), deleteMinistry);

export default router;

import { Router } from 'express';
import ministryRoutes from './ministry.routes';
import personRoutes from './person.routes';

const router = Router();

router.use('/ministries', ministryRoutes);
router.use('/', personRoutes);

export default router;

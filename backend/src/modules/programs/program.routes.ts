import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import {
  getPrograms,
  getProgram,
  generateProgram,
  generateBatchPrograms,
  updateProgram,
  updateProgramStatus,
  updateAssignment,
  deleteProgram,
  deleteAllPrograms,
  publishAllPrograms,
  getProgramStats,
  previewProgramScoring,
} from './program.controller';

const router = Router();
router.use(authenticate, tenantGuard);

router.get('/:id/flyer', rbac('programs', 'read'), require('./program.controller').downloadProgramFlyerPdf);
router.get('/stats', rbac('programs', 'read'), getProgramStats);
router.get('/preview-scoring', rbac('programs', 'read'), previewProgramScoring);
router.get('/', rbac('programs', 'read'), getPrograms);
router.get('/:id', rbac('programs', 'read'), getProgram);
router.post('/generate', rbac('programs', 'create'), generateProgram);
router.post('/generate-batch', rbac('programs', 'create'), generateBatchPrograms);
router.put('/:id', rbac('programs', 'update'), updateProgram);
router.patch('/:id/status', rbac('programs', 'update'), updateProgramStatus);
router.patch('/:id/assignments', rbac('programs', 'update'), updateAssignment);
router.patch('/publish-all', rbac('programs', 'update'), publishAllPrograms);
router.delete('/all', rbac('programs', 'delete'), deleteAllPrograms);
router.delete('/:id', rbac('programs', 'delete'), deleteProgram);

export default router;

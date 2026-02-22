import { Router } from 'express';
import {
  getBibleStudies,
  getBibleStudy,
  createBibleStudy,
  updateBibleStudy,
  deleteBibleStudy,
  trackDownload,
  getSeries,
} from './bible-studies.controller';
import { uploadPdf, deletePdf } from './upload.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';

const router = Router();

// Rutas públicas (sin autenticación requerida)
router.get('/', getBibleStudies);
router.get('/meta/series', getSeries);
router.get('/:id', getBibleStudy);
router.post('/:id/download', trackDownload);

// Rutas protegidas (requieren autenticación + permisos)
router.use(authenticate, tenantGuard);

router.post('/', rbac('bible_studies', 'create'), createBibleStudy);
router.put('/:id', rbac('bible_studies', 'update'), updateBibleStudy);
router.delete('/:id', rbac('bible_studies', 'delete'), deleteBibleStudy);

// Rutas de subida de PDFs
router.post('/upload/pdf', rbac('bible_studies', 'create'), uploadPdf);
router.delete('/upload/pdf/:publicId', rbac('bible_studies', 'delete'), deletePdf);

export default router;

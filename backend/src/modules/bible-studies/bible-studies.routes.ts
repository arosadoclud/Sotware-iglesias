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
import { uploadPdf, deletePdf, upload } from './upload.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import envConfig from '../../config/env';

const router = Router();

// Ruta de verificación de configuración de Cloudinary (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  router.get('/cloudinary-check', (req, res) => {
    res.json({
      cloudinaryConfigured: !!(envConfig.cloudinaryCloudName && envConfig.cloudinaryApiKey && envConfig.cloudinaryApiSecret),
      cloudName: !!envConfig.cloudinaryCloudName,
      apiKey: !!envConfig.cloudinaryApiKey,
      apiSecret: !!envConfig.cloudinaryApiSecret,
    });
  });
}

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
router.post('/upload/pdf', rbac('bible_studies', 'create'), upload.single('pdf'), uploadPdf);
router.delete('/upload/pdf/:publicId', rbac('bible_studies', 'delete'), deletePdf);

export default router;

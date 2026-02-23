import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import { uploadLogo } from './logo.controller';

const router = Router();

// Usamos memoria en vez de disco para enviar el buffer a Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp|svg\+xml|gif)$/i.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP, SVG)'));
    }
  },
});

router.post('/', authenticate, tenantGuard, rbac('churches', 'update'), upload.single('logo'), uploadLogo);

export default router;

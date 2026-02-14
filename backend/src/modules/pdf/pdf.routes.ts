import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import { downloadProgramPdf, previewProgramPdf, getProgramPdfUrl } from './pdf.controller';

const router = Router();
router.use(authenticate, tenantGuard);

// GET /programs/:id/pdf          — descarga el PDF
router.get('/:id/pdf', rbac('programs', 'read'), downloadProgramPdf);

// GET /programs/:id/pdf/preview  — previsualiza como HTML en el browser
router.get('/:id/pdf/preview', rbac('programs', 'read'), previewProgramPdf);

// GET /programs/:id/pdf/url      — genera PDF y devuelve URL pública para compartir
router.get('/:id/pdf/url', rbac('programs', 'read'), getProgramPdfUrl);

export default router;

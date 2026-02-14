import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import {
  getLetterTemplates, getLetterTemplate, createLetterTemplate,
  updateLetterTemplate, deleteLetterTemplate, getGeneratedLetters,
  generateLetter, downloadLetterPdf, deleteGeneratedLetter
} from './letter.controller';

const router = Router();
router.use(authenticate, tenantGuard);

router.get('/templates', rbac('letters', 'read'), getLetterTemplates);
router.get('/templates/:id', rbac('letters', 'read'), getLetterTemplate);
router.post('/templates', rbac('letters', 'create'), createLetterTemplate);
router.put('/templates/:id', rbac('letters', 'update'), updateLetterTemplate);
router.delete('/templates/:id', rbac('letters', 'delete'), deleteLetterTemplate);
router.get('/generated', rbac('letters', 'read'), getGeneratedLetters);
router.delete('/generated/:id', rbac('letters', 'delete'), deleteGeneratedLetter);
router.post('/generate', rbac('letters', 'create'), generateLetter);
router.post('/download-pdf', rbac('letters', 'read'), downloadLetterPdf);

export default router;

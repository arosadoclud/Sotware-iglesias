import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import {
  getNewMembers,
  getNewMember,
  createNewMember,
  updateNewMember,
  deleteNewMember,
  addFollowUp,
  updatePhase,
  scheduleAlert,
  deleteAlert,
  convertToPerson,
  getNewMemberStats,
  sendWhatsAppMessage,
} from './newMember.controller';

const router = Router();

// Todas las rutas requieren autenticación + tenant
router.use(authenticate);

// Stats
router.get('/stats',         tenantGuard, rbac('persons', 'read'),   getNewMemberStats);

// CRUD
router.get('/',              tenantGuard, rbac('persons', 'read'),   getNewMembers);
router.get('/:id',           tenantGuard, rbac('persons', 'read'),   getNewMember);
router.post('/',             tenantGuard, rbac('persons', 'create'), createNewMember);
router.put('/:id',           tenantGuard, rbac('persons', 'update'), updateNewMember);
router.delete('/:id',        tenantGuard, rbac('persons', 'delete'), deleteNewMember);

// Follow-up
router.post('/:id/follow-up',        tenantGuard, rbac('persons', 'update'), addFollowUp);
router.patch('/:id/phase',           tenantGuard, rbac('persons', 'update'), updatePhase);
router.post('/:id/alerts',           tenantGuard, rbac('persons', 'update'), scheduleAlert);
router.delete('/:id/alerts/:alertId', tenantGuard, rbac('persons', 'update'), deleteAlert);

// Convert to full person
router.post('/:id/convert',          tenantGuard, rbac('persons', 'create'), convertToPerson);

// WhatsApp
router.post('/:id/whatsapp',         tenantGuard, rbac('persons', 'update'), sendWhatsAppMessage);

export default router;

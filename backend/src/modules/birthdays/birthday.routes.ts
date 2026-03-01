import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import { getBirthdays, updateBirthday } from './birthday.controller';

const router = Router();

// GET  /birthdays        — lista todos los miembros con sus cumpleaños
router.get('/', authenticate, tenantGuard, rbac('birthdays', 'read'), getBirthdays);

// PATCH /birthdays/:personId — actualizar fecha de cumpleaños de una persona
router.patch('/:personId', authenticate, tenantGuard, rbac('birthdays', 'update'), updateBirthday);

export default router;

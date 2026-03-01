import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import { getBirthdays, updateBirthday, createBirthday, updateBirthdayFull, deleteBirthdayPerson } from './birthday.controller';

const router = Router();

// GET    /birthdays              — lista todos los miembros con sus cumpleaños
router.get('/',          authenticate, tenantGuard, rbac('birthdays', 'read'),   getBirthdays);

// POST   /birthdays              — crear nueva persona desde sección cumpleaños
router.post('/',         authenticate, tenantGuard, rbac('birthdays', 'create'), createBirthday);

// PUT    /birthdays/:personId    — actualizar todos los campos de una persona
router.put('/:personId', authenticate, tenantGuard, rbac('birthdays', 'update'), updateBirthdayFull);

// PATCH  /birthdays/:personId   — actualizar solo la fecha de cumpleaños
router.patch('/:personId', authenticate, tenantGuard, rbac('birthdays', 'update'), updateBirthday);

// DELETE /birthdays/:personId   — eliminar persona
router.delete('/:personId', authenticate, tenantGuard, rbac('birthdays', 'delete'), deleteBirthdayPerson);

export default router;

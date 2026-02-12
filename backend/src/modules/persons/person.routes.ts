import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard, planLimit } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import { getPersons, getPerson, createPerson, updatePerson, deletePerson, getMinistries } from './person.controller';

const router = Router();
router.use(authenticate, tenantGuard);

router.get('/', rbac('persons', 'read'), getPersons);
router.get('/ministries', rbac('persons', 'read'), getMinistries);
router.get('/:id', rbac('persons', 'read'), getPerson);
router.post('/', rbac('persons', 'create'), planLimit('persons'), createPerson);
router.put('/:id', rbac('persons', 'update'), updatePerson);
router.delete('/:id', rbac('persons', 'delete'), deletePerson);

export default router;

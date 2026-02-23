import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';

const router = Router();

// Todas las rutas requieren autenticación y tenantGuard
router.use(authenticate, tenantGuard);

// Placeholder — aquí se añadirán los endpoints pastorales
router.get('/status', rbac('pastoral', 'read'), (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Módulo Pastoral activo. Próximamente se añadirán funcionalidades.',
      module: 'pastoral',
    },
  });
});

export default router;

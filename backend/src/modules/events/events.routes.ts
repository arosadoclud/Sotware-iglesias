import { Router } from 'express'
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  reorderEvents,
} from './events.controller'
import { upload, uploadEventImage, deleteEventImage } from './upload.controller'
import { authenticate } from '../../middleware/auth.middleware'
import { tenantGuard } from '../../middleware/tenant.middleware'

const router = Router()

// Rutas públicas (sin autenticación requerida)
router.get('/', getEvents)
router.get('/:id', getEvent)

// Rutas protegidas (requieren autenticación)
router.use(authenticate, tenantGuard)

router.post('/', createEvent)
router.put('/reorder', reorderEvents)
router.put('/:id', updateEvent)
router.delete('/:id', deleteEvent)

// Rutas de subida de imágenes
router.post('/upload', upload.single('image'), uploadEventImage)
router.delete('/upload/:filename', deleteEventImage)

export default router

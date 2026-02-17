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
import { protect } from '../../middleware/auth.middleware'
import { requireChurch } from '../../middleware/tenant.middleware'

const router = Router()

// Rutas públicas
router.get('/', requireChurch, getEvents)
router.get('/:id', getEvent)

// Rutas protegidas
router.use(protect, requireChurch)

router.post('/', createEvent)
router.put('/reorder', reorderEvents)
router.put('/:id', updateEvent)
router.delete('/:id', deleteEvent)

// Rutas de subida de imágenes
router.post('/upload', upload.single('image'), uploadEventImage)
router.delete('/upload/:filename', deleteEventImage)

export default router

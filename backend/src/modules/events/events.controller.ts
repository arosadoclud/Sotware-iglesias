import { Request, Response, NextFunction } from 'express'
import Event from '../../models/Event.model'
import { asyncHandler } from '../../utils/asyncHandler'
import { ApiError } from '../../utils/ApiError'

/**
 * @desc    Obtener todos los eventos
 * @route   GET /api/v1/events
 * @access  Public
 */
export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const { type, isActive = 'true', limit = '20', sort = '-order' } = req.query
  const churchId = (req as any).churchId

  const query: any = { church: churchId }

  if (type) query.type = type
  if (isActive !== 'all') query.isActive = isActive === 'true'

  const events = await Event.find(query)
    .sort(sort as string)
    .limit(parseInt(limit as string))
    .populate('createdBy', 'name email')
    .lean()

  res.status(200).json({
    success: true,
    data: events,
    count: events.length,
  })
})

/**
 * @desc    Obtener un evento por ID
 * @route   GET /api/v1/events/:id
 * @access  Public
 */
export const getEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const event = await Event.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('church', 'name')

  if (!event) {
    return next(new ApiError('Evento no encontrado', 404))
  }

  res.status(200).json({
    success: true,
    data: event,
  })
})

/**
 * @desc    Crear nuevo evento
 * @route   POST /api/v1/events
 * @access  Private
 */
export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const churchId = (req as any).churchId
  const userId = (req as any).userId

  const event = await Event.create({
    ...req.body,
    church: churchId,
    createdBy: userId,
  })

  res.status(201).json({
    success: true,
    data: event,
  })
})

/**
 * @desc    Actualizar evento
 * @route   PUT /api/v1/events/:id
 * @access  Private
 */
export const updateEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let event = await Event.findById(req.params.id)

  if (!event) {
    return next(new ApiError('Evento no encontrado', 404))
  }

  event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: event,
  })
})

/**
 * @desc    Eliminar evento
 * @route   DELETE /api/v1/events/:id
 * @access  Private
 */
export const deleteEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const event = await Event.findById(req.params.id)

  if (!event) {
    return next(new ApiError('Evento no encontrado', 404))
  }

  await event.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
  })
})

/**
 * @desc    Reordenar eventos
 * @route   PUT /api/v1/events/reorder
 * @access  Private
 */
export const reorderEvents = asyncHandler(async (req: Request, res: Response) => {
  const { events } = req.body // Array de { id, order }

  const updates = events.map((e: any) =>
    Event.findByIdAndUpdate(e.id, { order: e.order })
  )

  await Promise.all(updates)

  res.status(200).json({
    success: true,
    message: 'Eventos reordenados correctamente',
  })
})

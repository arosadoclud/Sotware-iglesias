import { Request, Response, NextFunction } from 'express'
import Event from '../../models/Event.model'

/**
 * @desc    Obtener todos los eventos
 * @route   GET /api/v1/events
 * @access  Public
 */
export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, isActive = 'true', limit = '20', sort = '-order', church } = req.query
    const churchId = (req as any).churchId || church

    const query: any = {}

    // Solo filtrar por iglesia si se proporciona
    if (churchId) {
      query.church = churchId
    }

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
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Obtener un evento por ID
 * @route   GET /api/v1/events/:id
 * @access  Public
 */
export const getEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('church', 'name')

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' })
    }

    res.status(200).json({
      success: true,
      data: event,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Crear nuevo evento
 * @route   POST /api/v1/events
 * @access  Private
 */
export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Actualizar evento
 * @route   PUT /api/v1/events/:id
 * @access  Private
 */
export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' })
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: event,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Eliminar evento
 * @route   DELETE /api/v1/events/:id
 * @access  Private
 */
export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' })
    }

    await event.deleteOne()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Reordenar eventos
 * @route   PUT /api/v1/events/reorder
 * @access  Private
 */
export const reorderEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { events } = req.body // Array de { id, order }

    const updates = events.map((e: any) =>
      Event.findByIdAndUpdate(e.id, { order: e.order })
    )

    await Promise.all(updates)

    res.status(200).json({
      success: true,
      message: 'Eventos reordenados correctamente',
    })
  } catch (error) {
    next(error)
  }
}

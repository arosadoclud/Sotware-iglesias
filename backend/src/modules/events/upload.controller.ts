import { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { asyncHandler } from '../../utils/asyncHandler'
import { ApiError } from '../../utils/ApiError'
import envConfig from '../../config/env'

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'events')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error as Error, uploadDir)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
    const ext = path.extname(file.originalname)
    cb(null, `event-${uniqueSuffix}${ext}`)
  },
})

// Filtro de archivos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
})

/**
 * @desc    Subir imagen de evento
 * @route   POST /api/v1/events/upload
 * @access  Private
 */
export const uploadEventImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError('Por favor sube una imagen', 400)
  }

  const imageUrl = `${envConfig.apiBaseUrl}/uploads/events/${req.file.filename}`

  res.status(200).json({
    success: true,
    data: {
      filename: req.file.filename,
      url: imageUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  })
})

/**
 * @desc    Eliminar imagen de evento
 * @route   DELETE /api/v1/events/upload/:filename
 * @access  Private
 */
export const deleteEventImage = asyncHandler(async (req: Request, res: Response) => {
  const { filename } = req.params
  const filepath = path.join(process.cwd(), 'uploads', 'events', filename)

  try {
    await fs.unlink(filepath)
    res.status(200).json({
      success: true,
      message: 'Imagen eliminada correctamente',
    })
  } catch (error) {
    throw new ApiError('No se pudo eliminar la imagen', 500)
  }
})

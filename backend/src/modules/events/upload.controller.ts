import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
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
const fileFilter = (req: any, file: any, cb: multer.FileFilterCallback) => {
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
export const uploadEventImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Por favor sube una imagen' })
    }

    // Construir URL de la imagen
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? envConfig.frontendUrl.replace('5173', '5000') // En producción usar la URL del backend
      : `http://localhost:${envConfig.port}`
    
    const imageUrl = `${baseUrl}/uploads/events/${req.file.filename}`

    res.status(200).json({
      success: true,
      data: {
        filename: req.file.filename,
        url: imageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Eliminar imagen de evento
 * @route   DELETE /api/v1/events/upload/:filename
 * @access  Private
 */
export const deleteEventImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params
    const filepath = path.join(process.cwd(), 'uploads', 'events', filename)

    try {
      await fs.unlink(filepath)
      res.status(200).json({
        success: true,
        message: 'Imagen eliminada correctamente',
      })
    } catch (error) {
      return res.status(500).json({ success: false, message: 'No se pudo eliminar la imagen' })
    }
  } catch (error) {
    next(error)
  }
}

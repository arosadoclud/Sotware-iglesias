import { Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { AuthRequest } from '../../middleware/auth.middleware';
import envConfig from '../../config/env';
import { ValidationError } from '../../utils/errors';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: envConfig.cloudinaryCloudName,
  api_key: envConfig.cloudinaryApiKey,
  api_secret: envConfig.cloudinaryApiSecret,
});

// Configuración de multer para manejo temporal
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /pdf/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = file.mimetype === 'application/pdf';

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB máximo para PDFs
  },
});

/**
 * @desc    Subir PDF a Cloudinary
 * @route   POST /api/v1/bible-studies/upload/pdf
 * @access  Private (EDITOR+)
 */
export const uploadPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ValidationError('Por favor sube un archivo PDF');
    }

    // Subir a Cloudinary como recurso RAW (no imagen)
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'bible-studies',
          resource_type: 'raw',
          format: 'pdf',
          public_id: `study-${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file!.buffer);
    });

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        fileSize: result.bytes,
        format: result.format,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar PDF de Cloudinary
 * @route   DELETE /api/v1/bible-studies/upload/pdf/:publicId
 * @access  Private (EDITOR+)
 */
export const deletePdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      throw new ValidationError('PublicId requerido');
    }

    // Cloudinary requiere reemplazar barras con %2F en la URL
    const decodedPublicId = decodeURIComponent(publicId);

    await cloudinary.uploader.destroy(decodedPublicId, { resource_type: 'raw' });

    res.status(200).json({
      success: true,
      message: 'PDF eliminado correctamente',
    });
  } catch (error: any) {
    // Cloudinary lanza error si el archivo no existe, pero lo tratamos como éxito
    res.status(200).json({
      success: true,
      message: 'PDF eliminado (o ya no existe)',
    });
  }
};

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

// Verificar configuración de Cloudinary
if (!envConfig.cloudinaryCloudName || !envConfig.cloudinaryApiKey || !envConfig.cloudinaryApiSecret) {
  console.error('⚠️ WARNING: Cloudinary credentials are not configured properly');
  console.error('CLOUDINARY_CLOUD_NAME:', envConfig.cloudinaryCloudName ? '✓' : '✗');
  console.error('CLOUDINARY_API_KEY:', envConfig.cloudinaryApiKey ? '✓' : '✗');
  console.error('CLOUDINARY_API_SECRET:', envConfig.cloudinaryApiSecret ? '✓' : '✗');
}

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

    // Validar credenciales de Cloudinary
    if (!envConfig.cloudinaryCloudName || !envConfig.cloudinaryApiKey || !envConfig.cloudinaryApiSecret) {
      console.error('❌ Cloudinary credentials missing:', {
        cloudName: !!envConfig.cloudinaryCloudName,
        apiKey: !!envConfig.cloudinaryApiKey,
        apiSecret: !!envConfig.cloudinaryApiSecret,
      });
      throw new ValidationError('Cloudinary no está configurado correctamente. Contacta al administrador.');
    }

    console.log('📤 Uploading PDF to Cloudinary:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // Subir a Cloudinary como recurso RAW (no imagen)
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'bible-studies',
          resource_type: 'raw',
          type: 'upload',
          access_mode: 'public',
          format: 'pdf',
          public_id: `study-${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ PDF uploaded successfully:', result.secure_url);
            resolve(result);
          }
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
  } catch (error: any) {
    console.error('❌ Error in uploadPdf controller:', error);
    if (error instanceof ValidationError) {
      next(error);
    } else {
      next(new ValidationError(`Error al subir PDF: ${error.message || 'Error desconocido'}`));
    }
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

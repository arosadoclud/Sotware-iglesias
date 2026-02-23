import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import Church from '../../models/Church.model';
import { v2 as cloudinary } from 'cloudinary';
import envConfig from '../../config/env';

// Configurar Cloudinary (mismas credenciales que bible-studies)
cloudinary.config({
  cloud_name: envConfig.cloudinaryCloudName,
  api_key: envConfig.cloudinaryApiKey,
  api_secret: envConfig.cloudinaryApiSecret,
});

// POST /churches/logo - subir logo de la iglesia a Cloudinary
export const uploadLogo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
    }

    const church = await Church.findById(req.churchId);
    if (!church) {
      return res.status(404).json({ success: false, message: 'Iglesia no encontrada' });
    }

    // Eliminar logo anterior en Cloudinary si existe
    if (church.logoUrl && church.logoUrl.includes('cloudinary')) {
      try {
        // Extraer public_id del URL de Cloudinary
        const parts = church.logoUrl.split('/');
        const filenameWithExt = parts[parts.length - 1];
        const folder = parts[parts.length - 2];
        const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      } catch (err) {
        // No detener el proceso si falla la eliminación del logo anterior
        console.warn('No se pudo eliminar el logo anterior de Cloudinary:', err);
      }
    }

    // Subir nuevo logo a Cloudinary como imagen
    const cloudinaryUrl: string = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'church-logos',
          resource_type: 'image',
          access_mode: 'public',
          transformation: [
            { width: 400, height: 400, crop: 'limit' }, // Limitar tamaño máximo
            { quality: 'auto', fetch_format: 'auto' },  // Optimizar
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!.secure_url);
        }
      );
      stream.end(req.file!.buffer);
    });

    // Guardar URL de Cloudinary en la iglesia
    church.logoUrl = cloudinaryUrl;
    await church.save();

    res.json({ success: true, data: church });
  } catch (error) {
    next(error);
  }
};

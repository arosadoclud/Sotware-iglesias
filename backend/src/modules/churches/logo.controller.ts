import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import Church from '../../models/Church.model';
import path from 'path';
import fs from 'fs';

// POST /churches/logo - subir logo
export const uploadLogo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
    const church = await Church.findById(req.churchId);
    if (!church) return res.status(404).json({ success: false, message: 'Iglesia no encontrada' });
    // Eliminar logo anterior si existe
    if (church.logoUrl && church.logoUrl.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '../../../uploads', path.basename(church.logoUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    // Guardar nueva ruta
    church.logoUrl = `/uploads/${req.file.filename}`;
    await church.save();
    res.json({ success: true, data: church });
  } catch (error) { next(error); }
};

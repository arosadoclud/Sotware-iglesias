import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import Ministry from '../../models/Ministry.model';

// GET /ministries - listar ministerios
export const getMinistries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ministries = await Ministry.find({ churchId: req.churchId }).sort({ name: 1 });
    res.json({ success: true, data: ministries });
  } catch (error) { next(error); }
};

// POST /ministries - crear ministerio
export const createMinistry = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    const ministry = await Ministry.create({
      churchId: req.churchId,
      name: name.trim(),
      description: description?.trim() || '',
      color: color || undefined,
    });
    res.status(201).json({ success: true, data: ministry });
  } catch (error) { next(error); }
};

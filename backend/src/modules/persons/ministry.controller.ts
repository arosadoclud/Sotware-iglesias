import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import Ministry from '../../models/Ministry.model';

// GET /ministries - listar ministerios
export const getMinistries = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ministries = await Ministry.find({ churchId: req.churchId }).sort({ name: 1 });
    res.json({ success: true, data: ministries });
  } catch (error) { next(error); }
};

// POST /ministries - crear ministerio
export const createMinistry = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, color } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
      return;
    }
    const ministry = await Ministry.create({
      churchId: req.churchId,
      name: name.trim(),
      description: description?.trim() || '',
      color: color || undefined,
    });
    res.status(201).json({ success: true, data: ministry });
  } catch (error) { next(error); }
};

// PUT /ministries/:id - actualizar ministerio
export const updateMinistry = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, color } = req.body;
    const ministry = await Ministry.findOneAndUpdate(
      { _id: req.params.id, churchId: req.churchId },
      { name: name?.trim(), description: description?.trim(), color },
      { new: true, runValidators: true }
    );
    if (!ministry) {
      res.status(404).json({ success: false, message: 'Ministerio no encontrado' });
      return;
    }
    res.json({ success: true, data: ministry });
  } catch (error) { next(error); }
};

// DELETE /ministries/:id - eliminar ministerio
export const deleteMinistry = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ministry = await Ministry.findOneAndDelete({ _id: req.params.id, churchId: req.churchId });
    if (!ministry) {
      res.status(404).json({ success: false, message: 'Ministerio no encontrado' });
      return;
    }
    res.json({ success: true, message: 'Ministerio eliminado' });
  } catch (error) { next(error); }
};

// POST /ministries/seed - inicializar ministerios predeterminados
export const seedDefaultMinistries = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const defaults = [
      { name: 'General', description: 'Ministerio general de la iglesia', color: '#6b7280' },
      { name: 'Adoración', description: 'Ministerio de alabanza y adoración', color: '#8b5cf6' },
      { name: 'Jóvenes', description: 'Ministerio de jóvenes', color: '#3b82f6' },
      { name: 'Damas', description: 'Ministerio de damas', color: '#ec4899' },
      { name: 'Caballeros', description: 'Ministerio de caballeros', color: '#14b8a6' },
      { name: 'Niños', description: 'Ministerio de niños', color: '#f59e0b' },
      { name: 'Evangelismo', description: 'Ministerio de evangelismo', color: '#22c55e' },
      { name: 'Ujieres', description: 'Ministerio de ujieres', color: '#64748b' },
      { name: 'Intercesión', description: 'Ministerio de oración e intercesión', color: '#a855f7' },
      { name: 'Escuela Bíblica', description: 'Ministerio de enseñanza bíblica', color: '#0ea5e9' },
    ];

    for (const ministry of defaults) {
      try {
        await Ministry.findOneAndUpdate(
          { churchId: req.churchId, name: ministry.name },
          { ...ministry, churchId: req.churchId },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error(`Error creating default ministry ${ministry.name}:`, error);
      }
    }

    const ministries = await Ministry.find({ churchId: req.churchId }).sort({ name: 1 });
    res.json({ success: true, message: 'Ministerios predeterminados creados', data: ministries });
  } catch (error) { next(error); }
};

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import Church from '../../models/Church.model';

// GET /churches/mine
export const getMyChurch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const church = await Church.findById(req.churchId);
    if (!church) return res.status(404).json({ success: false, message: 'Iglesia no encontrada' });
    res.json({ success: true, data: church });
  } catch (error) { next(error); }
};

// PUT /churches/mine
export const updateMyChurch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const church = await Church.findByIdAndUpdate(req.churchId, req.body, { new: true, runValidators: true });
    if (!church) return res.status(404).json({ success: false, message: 'Iglesia no encontrada' });
    res.json({ success: true, data: church });
  } catch (error) { next(error); }
};

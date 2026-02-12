import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import ActivityType from '../../models/ActivityType.model';

export const getActivityTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter: any = { churchId: req.churchId };
    if (req.query.dayOfWeek !== undefined) filter.dayOfWeek = Number(req.query.dayOfWeek);
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const activities = await ActivityType.find(filter).sort({ dayOfWeek: 1, name: 1 });
    res.json({ success: true, data: activities });
  } catch (error) { next(error); }
};

export const getActivityType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activity = await ActivityType.findOne({ _id: req.params.id, churchId: req.churchId });
    if (!activity) return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
    res.json({ success: true, data: activity });
  } catch (error) { next(error); }
};

export const createActivityType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activity = await ActivityType.create({ ...req.body, churchId: req.churchId });
    res.status(201).json({ success: true, data: activity });
  } catch (error) { next(error); }
};

export const updateActivityType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activity = await ActivityType.findOneAndUpdate(
      { _id: req.params.id, churchId: req.churchId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!activity) return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
    res.json({ success: true, data: activity });
  } catch (error) { next(error); }
};

export const deleteActivityType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activity = await ActivityType.findOneAndDelete({ _id: req.params.id, churchId: req.churchId });
    if (!activity) return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
    res.json({ success: true, message: 'Actividad eliminada' });
  } catch (error) { next(error); }
};

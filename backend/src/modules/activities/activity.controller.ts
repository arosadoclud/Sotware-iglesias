import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import ActivityType from '../../models/ActivityType.model';

// Migración on-the-fly: si un doc tiene dayOfWeek legacy pero no daysOfWeek, migrar
async function migrateIfNeeded(activity: any) {
  const raw = activity._doc || activity;
  if ((!raw.daysOfWeek || raw.daysOfWeek.length === 0) && raw.dayOfWeek !== undefined) {
    await ActivityType.updateOne(
      { _id: activity._id },
      { $set: { daysOfWeek: [raw.dayOfWeek] }, $unset: { dayOfWeek: '' } }
    );
    activity.daysOfWeek = [raw.dayOfWeek];
  }
}

export const getActivityTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter: any = { churchId: req.churchId };
    if (req.query.dayOfWeek !== undefined) {
      // Buscar en ambos campos para compat
      filter.$or = [
        { daysOfWeek: Number(req.query.dayOfWeek) },
        { dayOfWeek: Number(req.query.dayOfWeek) },
      ];
    }
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const activities = await ActivityType.find(filter).sort({ name: 1 });

    // Migrar docs legacy on-the-fly
    for (const act of activities) {
      await migrateIfNeeded(act);
    }

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

// Normalizar payload: si llega dayOfWeek como número, convertir a daysOfWeek array
function normalizeDaysPayload(body: any) {
  if (body.daysOfWeek && Array.isArray(body.daysOfWeek)) return body;
  if (body.dayOfWeek !== undefined && typeof body.dayOfWeek === 'number') {
    return { ...body, daysOfWeek: [body.dayOfWeek] };
  }
  return body;
}

export const createActivityType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = normalizeDaysPayload(req.body);
    const activity = await ActivityType.create({ ...data, churchId: req.churchId });
    res.status(201).json({ success: true, data: activity });
  } catch (error) { next(error); }
};

export const updateActivityType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = normalizeDaysPayload(req.body);
    // Eliminar el campo legacy dayOfWeek al actualizar con daysOfWeek
    const updateOp: any = { $set: data };
    if (data.daysOfWeek) {
      updateOp.$unset = { dayOfWeek: '' };
      // No enviar dayOfWeek en $set si está como virtual
      delete data.dayOfWeek;
    }
    const activity = await ActivityType.findOneAndUpdate(
      { _id: req.params.id, churchId: req.churchId },
      updateOp,
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

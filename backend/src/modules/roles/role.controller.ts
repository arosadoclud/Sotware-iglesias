import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import Role from '../../models/Role.model';

export const getRoles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const roles = await Role.find({ churchId: req.churchId }).sort({ name: 1 }).lean();
    res.json({ success: true, data: roles });
  } catch (error) { next(error); }
};

export const createRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const role = await Role.create({ ...req.body, churchId: req.churchId });
    res.status(201).json({ success: true, data: role });
  } catch (error) { next(error); }
};

export const updateRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const role = await Role.findOneAndUpdate(
      { _id: req.params.id, churchId: req.churchId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!role) return res.status(404).json({ success: false, message: 'Rol no encontrado' });
    res.json({ success: true, data: role });
  } catch (error) { next(error); }
};

export const deleteRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const role = await Role.findOneAndDelete({ _id: req.params.id, churchId: req.churchId });
    if (!role) return res.status(404).json({ success: false, message: 'Rol no encontrado' });
    res.json({ success: true, message: 'Rol eliminado' });
  } catch (error) { next(error); }
};

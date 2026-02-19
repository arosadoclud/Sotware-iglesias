import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import PersonStatus from '../../models/PersonStatus.model';

// Obtener todos los estados de persona
export const getPersonStatuses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const statuses = await PersonStatus.find({ churchId: req.churchId, isActive: true }).sort({ order: 1, name: 1 }).lean();
    res.json({ success: true, data: statuses });
  } catch (error) { next(error); }
};

// Obtener todos los estados (incluyendo inactivos) para administración
export const getAllPersonStatuses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const statuses = await PersonStatus.find({ churchId: req.churchId }).sort({ order: 1, name: 1 }).lean();
    res.json({ success: true, data: statuses });
  } catch (error) { next(error); }
};

// Crear nuevo estado
export const createPersonStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Obtener el orden máximo actual
    const maxOrder = await PersonStatus.findOne({ churchId: req.churchId })
      .sort({ order: -1 })
      .select('order');
    
    const status = await PersonStatus.create({
      ...req.body,
      churchId: req.churchId,
      order: (maxOrder?.order || 0) + 1,
    });
    res.status(201).json({ success: true, data: status });
  } catch (error) { next(error); }
};

// Actualizar estado
export const updatePersonStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await PersonStatus.findOneAndUpdate(
      { _id: req.params.id, churchId: req.churchId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!status) {
      res.status(404).json({ success: false, message: 'Estado no encontrado' });
      return;
    }
    res.json({ success: true, data: status });
  } catch (error) { next(error); }
};

// Eliminar estado (soft delete - solo desactivar)
export const deletePersonStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await PersonStatus.findOne({ _id: req.params.id, churchId: req.churchId });
    if (!status) {
      res.status(404).json({ success: false, message: 'Estado no encontrado' });
      return;
    }
    
    // No permitir eliminar estados predeterminados del sistema
    if (status.isDefault) {
      res.status(400).json({ success: false, message: 'No se pueden eliminar estados predeterminados' });
      return;
    }
    
    // Soft delete
    status.isActive = false;
    await status.save();
    
    res.json({ success: true, message: 'Estado eliminado' });
  } catch (error) { next(error); }
};

// Inicializar estados predeterminados para una iglesia
export const initializeDefaultStatuses = async (churchId: string) => {
  const defaults = [
    { name: 'Activo', code: 'ACTIVE', color: 'green', order: 1, isDefault: true },
    { name: 'Inactivo', code: 'INACTIVE', color: 'gray', order: 2, isDefault: true },
    { name: 'Nuevo', code: 'NEW', color: 'blue', order: 3, isDefault: true },
    { name: 'Líder', code: 'LEADER', color: 'purple', order: 4, isDefault: true },
    { name: 'Líder Adoración', code: 'LIDER_ADORACION', color: 'pink', order: 5, isDefault: true },
    { name: 'Líder de Evangelismo', code: 'LIDER_EVANGELISMO', color: 'orange', order: 6, isDefault: true },
    { name: 'Pastor/a', code: 'PASTOR', color: 'indigo', order: 7, isDefault: true },
    { name: 'Diáconos', code: 'DIACONOS', color: 'teal', order: 8, isDefault: true },
    { name: 'Líder de Ujieres', code: 'LIDER_UJIERES', color: 'yellow', order: 9, isDefault: true },
    { name: 'Líder de Limpieza', code: 'LIDER_LIMPIEZA', color: 'green', order: 10, isDefault: true },
    { name: 'Líder de Jóvenes', code: 'LIDER_JOVENES', color: 'blue', order: 11, isDefault: true },
    { name: 'Líder de Damas', code: 'LIDER_DAMAS', color: 'pink', order: 12, isDefault: true },
    { name: 'Líder de Caballeros', code: 'LIDER_CABALLEROS', color: 'gray', order: 13, isDefault: true },
    { name: 'Líder de Escuela Bíblica', code: 'LIDER_ESCUELA_BIBLICA', color: 'purple', order: 14, isDefault: true },
  ];

  for (const status of defaults) {
    try {
      await PersonStatus.findOneAndUpdate(
        { churchId, code: status.code },
        { ...status, churchId },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error(`Error creating default status ${status.code}:`, error);
    }
  }
};

// Endpoint para inicializar estados predeterminados
export const seedDefaultStatuses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await initializeDefaultStatuses(req.churchId!);
    const statuses = await PersonStatus.find({ churchId: req.churchId }).sort({ order: 1 });
    res.json({ success: true, message: 'Estados predeterminados creados', data: statuses });
  } catch (error) { next(error); }
};

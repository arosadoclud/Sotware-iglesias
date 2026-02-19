import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import Person from '../../models/Person.model';

export const getPersons = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, ministry, search, roleId } = req.query;
    const filter: any = { churchId: req.churchId };

    if (status) filter.status = status;
    if (ministry) filter.ministry = ministry;
    if (search) filter.fullName = { $regex: search, $options: 'i' };
    if (roleId) filter['roles.roleId'] = roleId;

    // Paginación
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const skip = (page - 1) * limit;

    // Proyección de campos
    const projection = 'fullName phone ministry status roles createdAt';

    const [persons, total] = await Promise.all([
      Person.find(filter)
        .select(projection)
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),  // Objetos planos (más rápido)
      Person.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: persons,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) { next(error); }
};

export const getPerson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const person = await Person.findOne({ _id: req.params.id, churchId: req.churchId });
    if (!person) return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    res.json({ success: true, data: person });
  } catch (error) { next(error); }
};

export const createPerson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const person = await Person.create({ ...req.body, churchId: req.churchId });
    res.status(201).json({ success: true, data: person });
  } catch (error) { next(error); }
};

export const updatePerson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const person = await Person.findOneAndUpdate(
      { _id: req.params.id, churchId: req.churchId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!person) return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    res.json({ success: true, data: person });
  } catch (error) { next(error); }
};

export const deletePerson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const person = await Person.findOneAndDelete({ _id: req.params.id, churchId: req.churchId });
    if (!person) return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    res.json({ success: true, message: 'Persona eliminada' });
  } catch (error) { next(error); }
};

// GET /persons/ministries - obtener ministerios únicos
export const getMinistries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ministries = await Person.distinct('ministry', { churchId: req.churchId, ministry: { $nin: [null, ''] } });
    res.json({ success: true, data: ministries.filter(Boolean).sort() });
  } catch (error) { next(error); }
};

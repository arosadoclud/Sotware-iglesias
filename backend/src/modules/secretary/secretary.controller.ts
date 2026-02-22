import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ChildPresentation } from '../../models/ChildPresentation.model';
import { Wedding } from '../../models/Wedding.model';
import { Baptism } from '../../models/Baptism.model';
import { Conversion } from '../../models/Conversion.model';
import { BoardMinutes } from '../../models/BoardMinutes.model';
import { Preacher } from '../../models/Preacher.model';
import { NotFoundError, ValidationError } from '../../utils/errors';

// Mapa de recursos disponibles
const MODELS: Record<string, any> = {
  'child-presentations': ChildPresentation,
  'weddings': Wedding,
  'baptisms': Baptism,
  'conversions': Conversion,
  'board-minutes': BoardMinutes,
  'preachers': Preacher,
};

const getModel = (resource: string) => {
  const model = MODELS[resource];
  if (!model) throw new ValidationError(`Recurso desconocido: ${resource}`);
  return model;
};

// ── GET ALL ──────────────────────────────────────────────────────────────────
export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { resource } = req.params;
    const Model = getModel(resource);
    const churchId = req.churchId;

    const { search, year, limit = '100', sort = '-createdAt' } = req.query as any;

    const filter: any = { churchId };

    if (year) {
      const y = parseInt(year);
      filter.createdAt = {
        $gte: new Date(`${y}-01-01`),
        $lte: new Date(`${y}-12-31T23:59:59`),
      };
    }

    if (search) {
      // Busca en campos de texto del modelo
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { personName: { $regex: search, $options: 'i' } },
        { childName: { $regex: search, $options: 'i' } },
        { groomName: { $regex: search, $options: 'i' } },
        { brideName: { $regex: search, $options: 'i' } },
      ];
    }

    const records = await Model.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET ONE ──────────────────────────────────────────────────────────────────
export const getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { resource, id } = req.params;
    const Model = getModel(resource);

    const record = await Model.findOne({ _id: id, churchId: req.churchId });
    if (!record) throw new NotFoundError('Registro no encontrado');

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// ── CREATE ───────────────────────────────────────────────────────────────────
export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { resource } = req.params;
    const Model = getModel(resource);

    const record = await Model.create({
      ...req.body,
      churchId: req.churchId,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE ───────────────────────────────────────────────────────────────────
export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { resource, id } = req.params;
    const Model = getModel(resource);

    const record = await Model.findOneAndUpdate(
      { _id: id, churchId: req.churchId },
      { ...req.body, updatedBy: req.user?._id },
      { new: true, runValidators: true }
    );

    if (!record) throw new NotFoundError('Registro no encontrado');

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// ── DELETE ───────────────────────────────────────────────────────────────────
export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { resource, id } = req.params;
    const Model = getModel(resource);

    const record = await Model.findOneAndDelete({ _id: id, churchId: req.churchId });
    if (!record) throw new NotFoundError('Registro no encontrado');

    res.status(200).json({ success: true, message: 'Registro eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// ── STATS ────────────────────────────────────────────────────────────────────
export const getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId;
    const year = parseInt((req.query.year as string) || String(new Date().getFullYear()));

    const dateFilter = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31T23:59:59`),
    };

    const [childPresentations, weddings, baptisms, conversions, boardMinutes, preachers] =
      await Promise.all([
        ChildPresentation.countDocuments({ churchId, presentationDate: dateFilter }),
        Wedding.countDocuments({ churchId, weddingDate: dateFilter }),
        Baptism.countDocuments({ churchId, baptismDate: dateFilter }),
        Conversion.countDocuments({ churchId, conversionDate: dateFilter }),
        BoardMinutes.countDocuments({ churchId, meetingDate: dateFilter }),
        Preacher.countDocuments({ churchId }),
      ]);

    res.status(200).json({
      success: true,
      data: { year, childPresentations, weddings, baptisms, conversions, boardMinutes, preachers },
    });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { BibleStudy } from '../../models/BibleStudy.model';
import { AuthRequest } from '../../middleware/auth.middleware';
import { NotFoundError, ValidationError } from '../../utils/errors';

/**
 * @desc    Obtener todos los estudios bíblicos (público + filtros)
 * @route   GET /api/v1/bible-studies
 * @access  Public
 */
export const getBibleStudies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      year, 
      month, 
      series, 
      isActive = 'true', 
      limit = '50', 
      sort = '-studyDate',
      search,
      church
    } = req.query;
    
    const churchId = (req as any).churchId || church;

    if (!churchId) {
      throw new ValidationError('ChurchId requerido');
    }

    const query: any = { churchId };

    // Filtro de activos
    if (isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    // Filtro por año y mes
    if (year) {
      const yearNum = parseInt(year as string);
      const startDate = new Date(yearNum, 0, 1);
      const endDate = new Date(yearNum + 1, 0, 1);
      query.studyDate = { $gte: startDate, $lt: endDate };

      if (month) {
        const monthNum = parseInt(month as string) - 1; // 0-indexed
        const monthStart = new Date(yearNum, monthNum, 1);
        const monthEnd = new Date(yearNum, monthNum + 1, 1);
        query.studyDate = { $gte: monthStart, $lt: monthEnd };
      }
    }

    // Filtro por serie
    if (series) {
      query.series = series;
    }

    // Búsqueda por texto
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { theme: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { teacher: { $regex: search, $options: 'i' } },
      ];
    }

    const studies = await BibleStudy.find(query)
      .sort(sort as string)
      .limit(parseInt(limit as string))
      .populate('createdBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      data: studies,
      count: studies.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener un estudio bíblico por ID
 * @route   GET /api/v1/bible-studies/:id
 * @access  Public
 */
export const getBibleStudy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const study = await BibleStudy.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!study) {
      throw new NotFoundError('Estudio bíblico no encontrado');
    }

    res.status(200).json({
      success: true,
      data: study,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear nuevo estudio bíblico
 * @route   POST /api/v1/bible-studies
 * @access  Private (EDITOR+)
 */
export const createBibleStudy = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId;
    const userId = req.userId;

    if (!churchId || !userId) {
      throw new ValidationError('ChurchId y UserId requeridos');
    }

    const study = await BibleStudy.create({
      ...req.body,
      churchId,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: study,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar estudio bíblico
 * @route   PUT /api/v1/bible-studies/:id
 * @access  Private (EDITOR+)
 */
export const updateBibleStudy = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId;
    const userId = req.userId;

    const study = await BibleStudy.findOne({ 
      _id: req.params.id, 
      churchId 
    });

    if (!study) {
      throw new NotFoundError('Estudio bíblico no encontrado');
    }

    // Actualizar campos
    Object.assign(study, req.body, { updatedBy: userId });
    await study.save();

    res.status(200).json({
      success: true,
      data: study,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar estudio bíblico
 * @route   DELETE /api/v1/bible-studies/:id
 * @access  Private (ADMIN+)
 */
export const deleteBibleStudy = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId;

    const study = await BibleStudy.findOne({ 
      _id: req.params.id, 
      churchId 
    });

    if (!study) {
      throw new NotFoundError('Estudio bíblico no encontrado');
    }

    await study.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Estudio bíblico eliminado',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Incrementar contador de descargas
 * @route   POST /api/v1/bible-studies/:id/download
 * @access  Public
 */
export const trackDownload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const study = await BibleStudy.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!study) {
      throw new NotFoundError('Estudio bíblico no encontrado');
    }

    res.status(200).json({
      success: true,
      data: { downloadCount: study.downloadCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener lista de series disponibles
 * @route   GET /api/v1/bible-studies/meta/series
 * @access  Public
 */
export const getSeries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { church } = req.query;
    const churchId = (req as any).churchId || church;

    if (!churchId) {
      throw new ValidationError('ChurchId requerido');
    }

    const series = await BibleStudy.distinct('series', { 
      churchId, 
      isActive: true,
      series: { $exists: true, $ne: '' }
    });

    res.status(200).json({
      success: true,
      data: series,
    });
  } catch (error) {
    next(error);
  }
};

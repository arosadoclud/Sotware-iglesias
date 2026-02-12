import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middleware/auth.middleware';
import Program, { ProgramStatus } from '../../models/Program.model';
import ActivityType from '../../models/ActivityType.model';
import Person from '../../models/Person.model';
import Church from '../../models/Church.model';
import { AssignmentEngine } from './engine/AssignmentEngine';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors';
import { notificationService } from '../notifications/notification.service';
import { cache, CacheKeys, CacheTTL } from '../../infrastructure/cache/CacheAdapter';

export const getPrograms = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, activityTypeId, from, to, limit = '50', page = '1' } = req.query;
    const filter: any = { churchId: req.churchId };
    if (status) filter.status = status;
    if (activityTypeId) filter['activityType.id'] = activityTypeId;
    if (from || to) {
      filter.programDate = {};
      if (from) filter.programDate.$gte = new Date(from as string);
      if (to) filter.programDate.$lte = new Date(to as string);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [programs, total] = await Promise.all([
      Program.find(filter).sort({ programDate: -1 }).skip(skip).limit(Number(limit)),
      Program.countDocuments(filter),
    ]);
    res.json({ success: true, data: programs, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getProgram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const program = await Program.findOne({ _id: req.params.id, churchId: req.churchId });
    if (!program) throw new NotFoundError('Programa no encontrado');
    res.json({ success: true, data: program });
  } catch (error) { next(error); }
};

export const generateProgram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { activityTypeId, programDate, notes } = req.body;
    if (!activityTypeId || !programDate) throw new BadRequestError('activityTypeId y programDate son requeridos');

    const dateObj = new Date(programDate);
    dateObj.setHours(0, 0, 0, 0);

    const existing = await Program.findOne({ churchId: req.churchId, 'activityType.id': activityTypeId, programDate: dateObj });
    if (existing) throw new ConflictError('Ya existe un programa para esta actividad y fecha');

    const activity = await ActivityType.findOne({ _id: activityTypeId, churchId: req.churchId });
    if (!activity) throw new NotFoundError('Actividad no encontrada');

    const church = await Church.findById(req.churchId).select('settings').lean();
    const rotationWeeks = church?.settings?.rotationWeeks || 4;

    // USAR EL ENGINE - no mas logica directamente aqui
    const engine = new AssignmentEngine(rotationWeeks);
    const generation = await engine.generateOne({
      churchId: req.churchId!,
      activityTypeId,
      targetDate: dateObj,
      generatedBy: { id: req.userId!, name: req.user?.fullName || 'Sistema' },
    });

    const program = await Program.create({
      churchId: req.churchId,
      churchName: 'IGLESIA ARCA EVANGELICA DIOS FUERTE',
      logoUrl: '/logo-arca.png',
      activityType: { id: activity._id, name: activity.name },
      programDate: dateObj,
      status: ProgramStatus.DRAFT,
      assignments: generation.assignments,
      notes: notes || '',
      generatedBy: { id: req.userId, name: req.user?.fullName || 'Sistema' },
    });

    // Invalidar cache de stats al crear programa
    await cache.del(CacheKeys.dashboardStats(req.churchId!));

    res.status(201).json({
      success: true,
      data: program,
      meta: {
        warnings: generation.warnings,
        stats: {
          totalAssigned: generation.stats.totalAssigned,
          totalNeeded: generation.stats.totalNeeded,
          coveragePercent: generation.stats.coveragePercent,
          personsUsed: generation.stats.personsUsed,
        },
      },
    });
  } catch (error) { next(error); }
};

export const generateBatchPrograms = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { activityTypeId, startDate, endDate } = req.body;
    if (!activityTypeId || !startDate || !endDate) throw new BadRequestError('activityTypeId, startDate y endDate son requeridos');

    const activity = await ActivityType.findOne({ _id: activityTypeId, churchId: req.churchId });
    if (!activity) throw new NotFoundError('Actividad no encontrada');

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: Date[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      if (cursor.getDay() === activity.dayOfWeek) {
        const d = new Date(cursor);
        d.setHours(0, 0, 0, 0);
        dates.push(d);
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (dates.length === 0) throw new BadRequestError('No hay fechas que coincidan con el dia de la actividad en el rango dado');
    if (dates.length > 52) throw new BadRequestError('El rango no puede generar mas de 52 programas a la vez');

    const church = await Church.findById(req.churchId).select('settings').lean();
    const rotationWeeks = church?.settings?.rotationWeeks || 4;

    // SIN fakeReq/fakeRes - el engine maneja todo
    const engine = new AssignmentEngine(rotationWeeks);
    const results = await engine.generateBatch({
      churchId: req.churchId!,
      activityTypeId,
      dates,
      generatedBy: { id: req.userId!, name: req.user?.fullName || 'Sistema' },
    });

    const generated = results.filter((r) => r.success);
    const errors = results.filter((r) => !r.success);

    res.status(201).json({
      success: true,
      data: {
        generated: generated.length,
        errors: errors.length,
        total: results.length,
        results: results.map((r) => ({
          date: r.date,
          success: r.success,
          programId: r.programId,
          error: r.error,
          warnings: r.warnings || [],
          coveragePercent: r.stats?.coveragePercent,
        })),
      },
    });
  } catch (error) { next(error); }
};

export const updateProgram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    delete req.body.churchId;
    const updateData = {
      ...req.body,
      churchName: 'IGLESIA ARCA EVANGELICA DIOS FUERTE',
      logoUrl: '/logo-arca.png',
    };
    const program = await Program.findOneAndUpdate({ _id: req.params.id, churchId: req.churchId }, updateData, { new: true, runValidators: true });
    if (!program) throw new NotFoundError('Programa no encontrado');
    res.json({ success: true, data: program });
  } catch (error) { next(error); }
};

export const updateProgramStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!Object.values(ProgramStatus).includes(status)) throw new BadRequestError('Estado invalido');
    const program = await Program.findOneAndUpdate({ _id: req.params.id, churchId: req.churchId }, { status }, { new: true });
    if (!program) throw new NotFoundError('Programa no encontrado');

    // Disparar notificaciones cuando el programa se publica
    if (status === 'PUBLISHED') {
      const church = await Church.findById(req.churchId);
      if (church) {
        // No await — fire and forget, las notificaciones son asíncronas
        notificationService.notifyProgramPublished(program, church).catch(err =>
          console.error('[Notifications] Error al notificar publicación:', err)
        );
      }
    }

    res.json({ success: true, data: program });
  } catch (error) { next(error); }
};

export const updateAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { assignmentId, newPersonId } = req.body;
    const program = await Program.findOne({ _id: req.params.id, churchId: req.churchId });
    if (!program) throw new NotFoundError('Programa no encontrado');
    const person = await Person.findOne({ _id: newPersonId, churchId: req.churchId });
    if (!person) throw new NotFoundError('Persona no encontrada');
    const assignment = program.assignments.find((a) => a._id?.toString() === assignmentId);
    if (!assignment) throw new NotFoundError('Asignacion no encontrada');
    assignment.person = { id: person._id, name: person.fullName, phone: person.phone || '' };
    assignment.isManual = true;
    assignment.assignedAt = new Date();
    await program.save();
    res.json({ success: true, data: program });
  } catch (error) { next(error); }
};

export const deleteProgram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const program = await Program.findOneAndDelete({ _id: req.params.id, churchId: req.churchId });
    if (!program) throw new NotFoundError('Programa no encontrado');
    await cache.del(CacheKeys.dashboardStats(req.churchId!));
    res.json({ success: true, message: 'Programa eliminado' });
  } catch (error) { next(error); }
};

export const getProgramStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // CACHE: stats del dashboard son costosas y cambian poco (TTL 5 min)
    const cacheKey = CacheKeys.dashboardStats(req.churchId!);
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const [totalPersons, totalActivities, totalPrograms, recentPrograms] = await Promise.all([
      Person.countDocuments({ churchId: req.churchId, status: 'ACTIVE' }),
      ActivityType.countDocuments({ churchId: req.churchId, isActive: true }),
      Program.countDocuments({ churchId: req.churchId }),
      Program.find({ churchId: req.churchId }).sort({ programDate: -1 }).limit(5).select('activityType programDate status assignments'),
    ]);
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const monthPrograms = await Program.find({ churchId: req.churchId, programDate: { $gte: last30Days } });
    const participatingPersons = new Set<string>();
    for (const prog of monthPrograms) {
      for (const a of prog.assignments) participatingPersons.add(a.person.id.toString());
    }
    const participationRate = totalPersons > 0 ? Math.round((participatingPersons.size / totalPersons) * 100) : 0;
    const statsData = { totalPersons, totalActivities, totalPrograms, participationRate, recentPrograms, programsThisMonth: monthPrograms.length };
    await cache.set(cacheKey, statsData, CacheTTL.STATS);
    res.json({ success: true, data: statsData });
  } catch (error) { next(error); }
};

export const previewProgramScoring = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { activityTypeId, programDate } = req.query;
    if (!activityTypeId || !programDate) throw new BadRequestError('activityTypeId y programDate son requeridos');
    const dateObj = new Date(programDate as string);
    dateObj.setHours(0, 0, 0, 0);
    const church = await Church.findById(req.churchId).select('settings').lean();
    const rotationWeeks = church?.settings?.rotationWeeks || 4;
    const engine = new AssignmentEngine(rotationWeeks);
    const generation = await engine.generateOne({
      churchId: req.churchId!,
      activityTypeId: activityTypeId as string,
      targetDate: dateObj,
      generatedBy: { id: req.userId!, name: 'Preview' },
    });
    res.json({ success: true, data: { assignments: generation.assignments, warnings: generation.warnings, stats: generation.stats, scoringBreakdowns: generation.stats.scoringBreakdowns } });
  } catch (error) { next(error); }
};

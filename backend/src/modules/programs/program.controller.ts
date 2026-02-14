import { generateFlyerPdf } from './generateFlyerPdf';
export const downloadProgramFlyerPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const program = await Program.findOne({ _id: req.params.id, churchId: req.churchId });
    if (!program) throw new NotFoundError('Programa no encontrado');

    // Preparar datos para la plantilla
    // Obtener hora y AM/PM
    let hour = '';
    let ampm = 'AM';
    if (program.defaultTime) {
      hour = program.defaultTime;
    }
    if (program.ampm) {
      ampm = program.ampm;
    }
    // Formatear hora igual que el frontend
    function formatTimeES(timeStr: string, ampm?: string): string {
      if (!timeStr) return '';
      const parts = timeStr.split(':');
      let h = parseInt(parts[0]);
      let m = parts[1] || '00';
      const displayAmpm = ampm || 'AM';
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${h12}:${m.padStart(2, '0')} ${displayAmpm}`;
    }
    // Formatear fecha igual que el frontend
    function formatDateES(dateObj: Date): string {
      if (!dateObj) return '—';
      const opts: Intl.DateTimeFormatOptions = {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      };
      const formatted = dateObj.toLocaleDateString('es-DO', opts);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    const flyerData = {
      churchName: program.churchName,
      logoUrl: program.logoUrl,
      worshipType: program.activityType.name,
      date: formatDateES(program.programDate),
      time: formatTimeES(hour, ampm),
      location: program.location || '',
      verse: program.verse || '',
      assignments: program.assignments.map(a => ({
        id: a.sectionOrder || a.id,
        name: a.roleName || a.sectionName || a.name,
        person: a.person?.name || '',
      })),
      churchSub: program.churchSub || '',
    };
    // Generar PDF
    const pdfBuffer = await generateFlyerPdf(flyerData);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="flyer-programa-${program._id}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
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
    const data = {
      ...program.toObject(),
      defaultTime: (program as any).programTime || '',
      church: {
        name: (program as any).churchName || '',
        subTitle: (program as any).churchSub || '',
        location: (program as any).location || '',
        logoUrl: (program as any).logoUrl || '',
      },
    };
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const generateProgram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { activityTypeId, programDate, notes, defaultTime, ampm } = req.body;
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
      defaultTime: defaultTime || '',
      ampm: ampm || 'AM',
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

    // Usar T12:00:00 para evitar problemas de zona horaria (UTC vs local)
    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    const dates: Date[] = [];
    const cursor = new Date(start);

    // Soportar multi-día: daysOfWeek es array, dayOfWeek (virtual) es compat
    const daysSet = new Set<number>(activity.daysOfWeek || [activity.dayOfWeek]);

    while (cursor <= end) {
      if (daysSet.has(cursor.getDay())) {
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
      churchName: req.body.church?.name || req.body.churchName || '',
      churchSub: req.body.church?.subTitle || req.body.churchSub || '',
      location: req.body.church?.location || req.body.location || '',
      logoUrl: req.body.logoUrl || req.body.church?.logoUrl || '',
      ampm: req.body.ampm || 'AM',
      programTime: req.body.defaultTime || req.body.programTime || '',
    };
    const program = await Program.findOneAndUpdate({ _id: req.params.id, churchId: req.churchId }, updateData, { new: true, runValidators: true });
    if (!program) throw new NotFoundError('Programa no encontrado');
    // Devolver datos en formato esperado por el frontend
    res.json({
      success: true,
      data: {
        ...program.toObject(),
        church: {
          name: program.churchName,
          subTitle: program.churchSub,
          location: program.location,
          logoUrl: program.logoUrl,
        },
        activityType: program.activityType,
        programDate: program.programDate,
        defaultTime: (program as any).programTime || '',
        ampm: program.ampm,
        verse: program.verse,
        assignments: program.assignments,
      },
    });
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
    const cacheKey = CacheKeys.dashboardStats(req.churchId!);
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const churchId = req.churchId!;
    const now = new Date();
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // --- Queries paralelas para stats base ---
    const [
      totalPersons,
      totalActivities,
      totalPrograms,
      upcomingPrograms,
      recentPrograms,
      allPersons,
      last6MonthsPrograms,
    ] = await Promise.all([
      Person.countDocuments({ churchId, status: 'ACTIVE' }),
      ActivityType.countDocuments({ churchId, isActive: true }),
      Program.countDocuments({ churchId }),
      Program.countDocuments({ churchId, programDate: { $gte: now } }),
      Program.find({ churchId })
        .sort({ programDate: -1 })
        .limit(5)
        .select('activityType programDate status assignments createdAt generatedBy'),
      Person.find({ churchId, status: 'ACTIVE' }).select('fullName ministry roles').lean(),
      (() => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return Program.find({ churchId, programDate: { $gte: sixMonthsAgo } })
          .select('programDate assignments')
          .lean();
      })(),
    ]);

    // --- Distribución por Ministerio ---
    const ministryCounts: Record<string, number> = {};
    for (const p of allPersons) {
      const ministry = (p as any).ministry || 'Sin Ministerio';
      ministryCounts[ministry] = (ministryCounts[ministry] || 0) + 1;
    }
    const MINISTRY_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const ministryDistribution = Object.entries(ministryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: MINISTRY_COLORS[i % MINISTRY_COLORS.length] }));

    // --- Top Participantes (últimos 6 meses) ---
    const personParticipations: Record<string, { name: string; count: number }> = {};
    for (const prog of last6MonthsPrograms) {
      for (const a of (prog as any).assignments || []) {
        if (a.person?.id) {
          const pid = a.person.id.toString();
          if (!personParticipations[pid]) {
            personParticipations[pid] = { name: a.person.name || 'Desconocido', count: 0 };
          }
          personParticipations[pid].count++;
        }
      }
    }
    const topParticipants = Object.values(personParticipations)
      .sort((a, b) => b.count - a.count)
      .slice(0, 7)
      .map((p) => ({ name: p.name, participations: p.count }));

    // --- Tendencia mensual de participaciones (6 meses) ---
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyTrend: { month: string; participations: number; programs: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mKey = `${d.getFullYear()}-${d.getMonth()}`;
      const label = monthNames[d.getMonth()];
      let participations = 0;
      let programs = 0;
      for (const prog of last6MonthsPrograms) {
        const pd = new Date((prog as any).programDate);
        if (`${pd.getFullYear()}-${pd.getMonth()}` === mKey) {
          programs++;
          participations += ((prog as any).assignments || []).length;
        }
      }
      monthlyTrend.push({ month: label, participations, programs });
    }

    // --- Participación del mes actual ---
    const monthPrograms = last6MonthsPrograms.filter(
      (p) => new Date((p as any).programDate) >= last30Days
    );
    const participatingPersons = new Set<string>();
    for (const prog of monthPrograms) {
      for (const a of (prog as any).assignments || []) {
        if (a.person?.id) participatingPersons.add(a.person.id.toString());
      }
    }
    const participationRate =
      totalPersons > 0 ? Math.round((participatingPersons.size / totalPersons) * 100) : 0;

    // --- Ministerios activos ---
    const activeMinistries = new Set(allPersons.map((p: any) => p.ministry).filter(Boolean)).size;

    // --- Actividad reciente (basada en programas reales) ---
    const recentActivity = recentPrograms.map((prog: any) => {
      const statusLabels: Record<string, string> = {
        DRAFT: 'Programa creado',
        PUBLISHED: 'Programa publicado',
        COMPLETED: 'Programa completado',
        CANCELLED: 'Programa cancelado',
      };
      const action = statusLabels[prog.status] || 'Programa actualizado';
      const progDate = new Date(prog.programDate);
      const description = `${prog.activityType?.name || 'Actividad'} - ${progDate.toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      const createdAt = prog.createdAt || prog.programDate;
      const diffMs = now.getTime() - new Date(createdAt).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      let time = '';
      if (diffHours < 1) time = 'Hace menos de 1 hora';
      else if (diffHours < 24) time = `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
      else time = `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

      return { action, description, time, status: prog.status };
    });

    const statsData = {
      totalPersons,
      totalActivities,
      totalPrograms,
      upcomingPrograms,
      activeMinistries,
      participationRate,
      programsThisMonth: monthPrograms.length,
      ministryDistribution,
      topParticipants,
      monthlyTrend,
      recentActivity,
      recentPrograms,
    };

    await cache.set(cacheKey, statsData, CacheTTL.STATS);
    res.json({ success: true, data: statsData });
  } catch (error) {
    next(error);
  }
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

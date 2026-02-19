import { generateFlyerPdf } from './generateFlyerPdf';
import { generateCleaningPdf } from './generateCleaningPdf';
export const downloadProgramFlyerPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const program = await Program.findOne({ _id: req.params.id, churchId: req.churchId });
    if (!program) throw new NotFoundError('Programa no encontrado');

    // Formatear fecha igual que el frontend - extraer YYYY-MM-DD del ISO para evitar desfase
    function formatDateES(dateObj: Date): string {
      if (!dateObj) return '—';
      const isoStr = dateObj instanceof Date ? dateObj.toISOString() : String(dateObj);
      const dateOnly = isoStr.slice(0, 10);
      const safeDate = new Date(dateOnly + 'T12:00:00');
      const opts: Intl.DateTimeFormatOptions = {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        timeZone: 'America/Santo_Domingo',
      };
      const formatted = safeDate.toLocaleDateString('es-ES', opts);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    // ── CLEANING GROUPS PDF ──
    if (program.generationType === 'cleaning_groups') {
      const cleaningData = {
        churchName: program.churchName || '',
        churchSub: program.churchSub || '',
        logoUrl: program.logoUrl || '',
        date: formatDateES(program.programDate),
        groupNumber: program.assignedGroupNumber || 1,
        totalGroups: program.totalGroups || 1,
        members: (program.cleaningMembers || []).map((m: any) => ({
          id: m.id?.toString() || '',
          name: m.name || '',
          phone: m.phone || '',
        })),
      };
      const pdfBuffer = await generateCleaningPdf(cleaningData);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="limpieza-grupo-${program.assignedGroupNumber}-${program._id}.pdf"`,
      });
      return res.send(pdfBuffer);
    }

    // ── STANDARD FLYER PDF ──
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
    const flyerData = {
      churchName: program.churchName,
      logoUrl: program.logoUrl,
      worshipType: program.activityType.name,
      date: formatDateES(program.programDate),
      time: formatTimeES(hour, ampm),
      location: program.location || '',
      verse: program.verse || '',
      verseText: (program as any).verseText || '',
      assignments: program.assignments.map(a => ({
        id: a.sectionOrder || a.id,
        name: a.roleName || a.sectionName || a.name,
        person: a.person?.name || '',
      })),
      churchSub: program.churchSub || '',
    };
    // Generar PDF
    const pdfBuffer = await generateFlyerPdf(flyerData);
    
    // Generar nombre descriptivo
    const dateStr = program.programDate.toISOString().split('T')[0];
    const activitySlug = (program.activityType?.name || 'programa')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const churchSlug = (program.churchName || 'iglesia')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const filename = `${churchSlug}-${activitySlug}-${dateStr}.pdf`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
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
import { getRandomVerse } from '../bible/bible.service';
import { screenshotService } from '../pdf/screenshot.service';

// Helper: Convertir hora 24h "HH:mm" → "H:MM AM/PM"
function formatTime24to12(time24: string): { formatted: string; period: 'AM' | 'PM' } {
  if (!time24) return { formatted: '', period: 'AM' };
  const [h, m] = time24.split(':').map(Number);
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return { formatted: `${h12}:${(m || 0).toString().padStart(2, '0')} ${period}`, period };
}

export const getPrograms = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, activityTypeId, from, to, limit = '50', page = '1', church } = req.query;
    const churchId = req.churchId || church;
    
    const filter: any = {};
    
    // Solo filtrar por iglesia si se proporciona
    if (churchId) {
      filter.churchId = churchId;
    }
    
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

    // Extraer solo YYYY-MM-DD y crear Date al mediodía LOCAL para evitar desfase UTC
    const dateOnly = String(programDate).slice(0, 10);
    const dateObj = new Date(dateOnly + 'T12:00:00');

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

    // Agregar versículo bíblico aleatorio
    const randomVerse = getRandomVerse();

    // Obtener hora de la actividad según el día de la semana
    const time24 = activity.getTimeForDay(dateObj.getDay());
    const activityTime = formatTime24to12(time24);

    const program = await Program.create({
      churchId: req.churchId,
      churchName: 'IGLESIA ARCA EVANGELICA DIOS FUERTE',
      logoUrl: '/logo-arca.png',
      activityType: { id: activity._id, name: activity.name },
      programDate: dateObj,
      defaultTime: defaultTime || activityTime.formatted,
      programTime: defaultTime || activityTime.formatted,
      ampm: ampm || activityTime.period,
      status: ProgramStatus.DRAFT,
      assignments: generation.assignments,
      notes: notes || '',
      verse: randomVerse.verse,
      verseText: randomVerse.verseText,
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
    const { activityTypeId, startDate, endDate, numberOfGroups } = req.body;
    
    // ══════════ REQUEST LOGGING ══════════
    console.log('\n📥 [BATCH-GENERATE] Request received:');
    console.log('   ActivityTypeId:', activityTypeId);
    console.log('   Date Range:', startDate, 'to', endDate);
    console.log('   Number of Groups:', numberOfGroups);
    console.log('   ChurchId:', req.churchId);
    console.log('   UserId:', req.userId);
    // ══════════ END REQUEST LOGGING ══════════
    
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
        d.setHours(12, 0, 0, 0); // Usar mediodía para evitar desfase UTC vs local
        dates.push(d);
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (dates.length === 0) throw new BadRequestError('No hay fechas que coincidan con el dia de la actividad en el rango dado');
    if (dates.length > 52) throw new BadRequestError('El rango no puede generar mas de 52 programas a la vez');

    // ──────────── CLEANING GROUPS LOGIC ────────────
    if (activity.generationType === 'cleaning_groups') {
      const numGroups = numberOfGroups || 4;
      if (numGroups < 2 || numGroups > 20) throw new BadRequestError('El número de grupos debe estar entre 2 y 20');

      // Obtener todos los miembros activos de la iglesia
      const activePersons = await Person.find({
        churchId: req.churchId,
        status: { $nin: ['INACTIVO', 'INACTIVE', 'inactivo', 'inactive'] },
      }).lean();

      if (activePersons.length < numGroups) {
        throw new BadRequestError(`No hay suficientes miembros activos (${activePersons.length}) para ${numGroups} grupos`);
      }

      // Mezclar aleatoriamente usando Fisher-Yates
      const shuffled = [...activePersons];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Dividir en grupos equitativos
      const groups: Array<Array<{ id: any; name: string; phone?: string }>> = Array.from({ length: numGroups }, () => []);
      shuffled.forEach((person, idx) => {
        const groupIdx = idx % numGroups;
        groups[groupIdx].push({
          id: person._id,
          name: person.fullName || `${person.firstName} ${person.lastName}`.trim(),
          phone: person.phone,
        });
      });

      // Logging de grupos formados
      console.log(`\n🔄 [CLEANING GROUPS] Distribución de ${activePersons.length} miembros en ${numGroups} grupos:`);
      groups.forEach((group, idx) => {
        console.log(`   📋 Grupo ${idx + 1}: ${group.length} personas`)
      });
      console.log(`   📊 Promedio: ${(activePersons.length / numGroups).toFixed(1)} personas por grupo\n`);

      // Obtener datos de la iglesia
      const church = await Church.findById(req.churchId).lean();

      // Generar programas con rotación de grupos
      const results: Array<{ date: Date; success: boolean; programId?: string; error?: string; groupNumber?: number }> = [];

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const groupIndex = i % numGroups;
        const groupNumber = groupIndex + 1;

        // Verificar si ya existe programa para esta fecha
        const existing = await Program.findOne({
          churchId: req.churchId,
          'activityType.id': activityTypeId,
          programDate: date,
        });

        if (existing) {
          results.push({ date, success: false, error: 'Ya existe un programa para esta fecha' });
          continue;
        }

        try {
          // Agregar versículo bíblico aleatorio
          const randomVerse = getRandomVerse();

          // Obtener hora formateada para esta fecha
          const cleaningTime24 = activity.getTimeForDay(date.getDay()) || activity.defaultTime || '10:00';
          const cleaningTime = formatTime24to12(cleaningTime24);

          // ══════════ DIAGNOSTIC LOGGING START ══════════
          const membersToSave = groups[groupIndex];
          console.log('\n🔍 [CREATE-DEBUG] Attempting to create cleaning program:');
          console.log('   Date:', date.toISOString());
          console.log('   Group Number:', groupNumber, '/', numGroups);
          console.log('   Members Count:', membersToSave.length);
          console.log('   First 2 Members:', JSON.stringify(membersToSave.slice(0, 2), null, 2));
          console.log('   ChurchId:', req.churchId);
          console.log('   Activity:', activity.name);
          // ══════════ DIAGNOSTIC LOGGING END ══════════

          const program = await Program.create({
            churchId: req.churchId,
            activityType: { id: activity._id, name: activity.name },
            programDate: date,
            status: 'DRAFT',
            generationType: 'cleaning_groups',
            assignedGroupNumber: groupNumber,
            totalGroups: numGroups,
            cleaningMembers: membersToSave,
            assignments: [], // No role assignments for cleaning
            churchName: church?.name || '',
            churchSub: church?.subTitle || '',
            location: church?.location || '',
            logoUrl: church?.logoUrl || '',
            programTime: cleaningTime.formatted,
            defaultTime: cleaningTime.formatted,
            verse: randomVerse.verse,
            verseText: randomVerse.verseText,
            generatedBy: { id: req.userId!, name: req.user?.fullName || 'Sistema' },
            generatedAt: new Date(),
          });

          // ══════════ VERIFICATION START ══════════
          console.log('✅ [CREATE-DEBUG] Create returned successfully:');
          console.log('   Program ID:', program._id.toString());
          console.log('   GenerationType:', program.generationType);
          console.log('   AssignedGroupNumber:', program.assignedGroupNumber);
          console.log('   Members in returned doc:', program.cleaningMembers?.length || 0);
          
          // Immediate verification query
          const immediateVerify = await Program.findById(program._id);
          console.log('🔎 [CREATE-DEBUG] Immediate DB verification:');
          console.log('   Found in DB:', immediateVerify ? 'YES ✅' : 'NO ❌');
          if (immediateVerify) {
            console.log('   Members persisted:', immediateVerify.cleaningMembers?.length || 0);
            console.log('   GenerationType in DB:', immediateVerify.generationType);
          }
          console.log(''); // Blank line for readability
          // ══════════ VERIFICATION END ══════════

          results.push({ date, success: true, programId: program._id.toString(), groupNumber });
        } catch (err: any) {
          console.error('❌ [CREATE-DEBUG] Error creating program:', err.message);
          console.error('   Stack:', err.stack);
          results.push({ date, success: false, error: err.message });
        }
      }

      const generated = results.filter((r) => r.success);
      const errors = results.filter((r) => !r.success);

      // ══════════ FINAL VERIFICATION ══════════
      console.log('\n🏁 [FINAL-VERIFICATION] Confirming programs in database:');
      const finalCount = await Program.countDocuments({
        churchId: req.churchId,
        generationType: 'cleaning_groups'
      });
      console.log('   Programs created in this call:', generated.length);
      console.log('   Total cleaning programs in DB:', finalCount);
      const programIds = generated.map(g => g.programId).filter(Boolean);
      console.log('   Program IDs created:', programIds.join(', '));
      
      // Verify each created program
      for (const id of programIds) {
        const exists = await Program.findById(id);
        console.log(`   - ${id}: ${exists ? '✅ EXISTS' : '❌ MISSING'} ${exists ? `(${exists.cleaningMembers?.length || 0} members)` : ''}`);
      }
      console.log(''); // Blank line
      // ══════════ END FINAL VERIFICATION ══════════

      return res.status(201).json({
        success: true,
        data: {
          generated: generated.length,
          errors: errors.length,
          total: results.length,
          isCleaningGroups: true,
          numberOfGroups: numGroups,
          totalMembers: activePersons.length,
          membersPerGroup: Math.ceil(activePersons.length / numGroups),
          groupDetails: groups.map((group, idx) => ({
            groupNumber: idx + 1,
            memberCount: group.length,
            members: group.map(m => m.name)
          })),
          results: results.map((r) => ({
            date: r.date,
            success: r.success,
            programId: r.programId,
            error: r.error,
            groupNumber: r.groupNumber,
          })),
        },
      });
    }
    // ──────────── END CLEANING GROUPS LOGIC ────────────

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
    // Extraer AM/PM de programTime si no viene explícito
    const rawTime = req.body.programTime || req.body.defaultTime || '';
    let ampmValue = req.body.ampm || '';
    if (!ampmValue && rawTime) {
      if (/PM/i.test(rawTime)) ampmValue = 'PM';
      else if (/AM/i.test(rawTime)) ampmValue = 'AM';
    }
    const updateData = {
      ...req.body,
      churchName: req.body.church?.name || req.body.churchName || '',
      churchSub: req.body.church?.subTitle || req.body.churchSub || '',
      location: req.body.church?.location || req.body.location || '',
      logoUrl: req.body.logoUrl || req.body.church?.logoUrl || '',
      ampm: ampmValue || 'PM',
      programTime: req.body.programTime || req.body.defaultTime || '',
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

    // Disparar notificaciones y generar screenshot cuando el programa se publica
    if (status === 'PUBLISHED') {
      const church = await Church.findById(req.churchId);
      if (church) {
        console.log('[Controller] 📢 Programa publicado, iniciando tareas...');
        
        // No await — fire and forget, las notificaciones son asíncronas
        notificationService.notifyProgramPublished(program, church).catch(err =>
          console.error('[Notifications] Error al notificar publicación:', err)
        );

        // Generar screenshot automático en background
        console.log('[Controller] 🚀 Disparando generación de screenshot...');
        screenshotService.generateScreenshot({
          program,
          church,
        }).then(async (result) => {
          console.log('[Controller] ✅ Screenshot generado:', result.url);
          // Actualizar el programa con la URL del screenshot
          const updatedProgram = await Program.findByIdAndUpdate(
            program._id, 
            { screenshotUrl: result.url },
            { new: true }
          );
          console.log('[Controller] 💾 Programa actualizado con screenshotUrl');
          return updatedProgram;
        }).catch(err => {
          console.error('[Controller] ❌ Error al generar captura:', err);
          console.error('[Controller] Error stack:', err.stack);
        });
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

export const deleteAllPrograms = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await Program.deleteMany({ churchId: req.churchId });
    await cache.del(CacheKeys.dashboardStats(req.churchId!));
    res.json({ 
      success: true, 
      message: `${result.deletedCount} programa${result.deletedCount !== 1 ? 's' : ''} eliminado${result.deletedCount !== 1 ? 's' : ''}`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) { next(error); }
};

export const publishAllPrograms = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await Program.updateMany(
      { churchId: req.churchId, status: 'DRAFT' },
      { $set: { status: 'PUBLISHED' } }
    );
    await cache.del(CacheKeys.dashboardStats(req.churchId!));
    res.json({ 
      success: true, 
      message: `${result.modifiedCount} programa${result.modifiedCount !== 1 ? 's' : ''} publicado${result.modifiedCount !== 1 ? 's' : ''}`,
      data: { publishedCount: result.modifiedCount }
    });
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
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // --- Queries paralelas optimizadas ---
    const [
      totalPersons,
      totalActivities,
      totalPrograms,
      upcomingPrograms,
      recentPrograms,
      ministryAggregation,
      last6MonthsData,
    ] = await Promise.all([
      Person.countDocuments({ churchId, status: 'ACTIVE' }),
      ActivityType.countDocuments({ churchId, isActive: true }),
      Program.countDocuments({ churchId }),
      Program.countDocuments({ churchId, programDate: { $gte: now } }),
      
      // Programas recientes con solo los campos necesarios
      Program.find({ churchId })
        .sort({ programDate: -1 })
        .limit(5)
        .select('activityType programDate status assignments createdAt')
        .populate('activityType', 'name')
        .lean(),
      
      // Agregación para contar ministerios (más eficiente que traer todas las personas)
      Person.aggregate([
        { $match: { churchId, status: 'ACTIVE' } },
        { $group: { _id: '$ministry', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Agregación para obtener datos de los últimos 6 meses
      Program.aggregate([
        { 
          $match: { 
            churchId, 
            programDate: { $gte: sixMonthsAgo } 
          } 
        },
        {
          $project: {
            programDate: 1,
            year: { $year: '$programDate' },
            month: { $month: '$programDate' },
            assignmentsCount: { $size: { $ifNull: ['$assignments', []] } },
            assignments: 1
          }
        }
      ]),
    ]);

    // --- Distribución por Ministerio (ya agregado por MongoDB) ---
    const MINISTRY_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const ministryDistribution = ministryAggregation.map((item, i) => ({
      name: item._id || 'Sin Ministerio',
      value: item.count,
      color: MINISTRY_COLORS[i % MINISTRY_COLORS.length]
    }));

    // --- Top Participantes (optimizado con Map) ---
    const personParticipations = new Map<string, { name: string; count: number }>();
    
    for (const prog of last6MonthsData) {
      if (prog.assignments) {
        for (const a of prog.assignments) {
          if (a.person?.id) {
            const pid = a.person.id.toString();
            const existing = personParticipations.get(pid);
            if (existing) {
              existing.count++;
            } else {
              personParticipations.set(pid, { 
                name: a.person.name || 'Desconocido', 
                count: 1 
              });
            }
          }
        }
      }
    }
    
    const topParticipants = Array.from(personParticipations.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 7)
      .map((p) => ({ name: p.name, participations: p.count }));

    // --- Tendencia mensual (optimizado con agregación previa) ---
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyData = new Map<string, { participations: number; programs: number }>();
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyData.set(mKey, { participations: 0, programs: 0 });
    }
    
    // Llenar con datos reales
    for (const prog of last6MonthsData) {
      const mKey = `${prog.year}-${prog.month}`;
      const existing = monthlyData.get(mKey);
      if (existing) {
        existing.programs++;
        existing.participations += prog.assignmentsCount || 0;
      }
    }
    
    const monthlyTrend = Array.from(monthlyData.entries()).map(([key, data]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month: monthNames[month - 1],
        participations: data.participations,
        programs: data.programs
      };
    });

    // --- Tasa de participación del mes ---
    const monthPrograms = last6MonthsData.filter(
      (p) => new Date(p.programDate) >= last30Days
    );
    
    const participatingPersons = new Set<string>();
    for (const prog of monthPrograms) {
      if (prog.assignments) {
        for (const a of prog.assignments) {
          if (a.person?.id) {
            participatingPersons.add(a.person.id.toString());
          }
        }
      }
    }
    
    const participationRate = totalPersons > 0 
      ? Math.round((participatingPersons.size / totalPersons) * 100) 
      : 0;

    // --- Ministerios activos ---
    const activeMinistries = ministryAggregation.filter(m => m._id).length;

    // --- Actividad reciente ---
    const statusLabels: Record<string, string> = {
      DRAFT: 'Programa creado',
      PUBLISHED: 'Programa publicado',
      COMPLETED: 'Programa completado',
      CANCELLED: 'Programa cancelado',
    };
    
    const recentActivity = recentPrograms.map((prog: any) => {
      const action = statusLabels[prog.status] || 'Programa actualizado';
      const progDate = new Date(prog.programDate);
      const description = `${prog.activityType?.name || 'Actividad'} - ${progDate.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })}`;
      
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

    // Cachear por 30 minutos
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

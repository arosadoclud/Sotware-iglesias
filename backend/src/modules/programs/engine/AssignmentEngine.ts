import mongoose from 'mongoose';
import Person, { IPerson } from '../../../models/Person.model';
import Program, { IProgram } from '../../../models/Program.model';
import ActivityType, { IActivityType, IActivityRoleConfig } from '../../../models/ActivityType.model';
import { getRandomVerse } from '../../bible/bible.service';

// Interface simplificada para breakdown de puntuación
interface ScoringBreakdown {
  personId: string;
  personName: string;
  totalScore: number;
  breakdown: {
    participations: number;
    avgParticipations: number;
    weeksSinceLastRole: number | null;
    neverHadRole: boolean;
    consecutiveWeeks: number;
  };
}

/**
 * ASSIGNMENT ENGINE — Paso 3: Motor de Asignación v2
 *
 * MEJORAS vs. el controller original:
 *
 * 1. Separación de responsabilidades:
 *    - Antes: toda la lógica dentro del controller (400+ líneas mezcladas)
 *    - Ahora: Engine independiente, testeable, reutilizable
 *
 * 2. Eliminación del antipatrón fakeReq/fakeRes:
 *    - Antes: generateBatchPrograms creaba un fakeReq/fakeRes para reutilizar generateProgram
 *    - Ahora: generateOne() es una función pura que no necesita req/res
 *
 * 3. Algoritmo corregido:
 *    - Antes: score invertido (los más activos se seleccionaban primero)
 *    - Ahora: FairnessCalculator normalizado con 3 componentes balanceados
 *
 * 4. Carga eficiente:
 *    - Antes: N queries dentro de loops
 *    - Ahora: 2 queries al inicio, todo procesado en memoria
 */

export interface GenerationParams {
  churchId: string;
  activityTypeId: string;
  targetDate: Date;
  generatedBy: { id: string; name: string };
  notes?: string;
  excludePersonIds?: Set<string>; // Para evitar repetir personas entre programas del lote
}

export interface GenerationResult {
  assignments: AssignmentResult[];
  warnings: GenerationWarning[];
  stats: GenerationStats;
}

export interface AssignmentResult {
  sectionName: string;
  sectionOrder: number;
  roleName: string;
  person: {
    id: mongoose.Types.ObjectId;
    name: string;
    phone: string;
  };
  backup: {
    id: mongoose.Types.ObjectId;
    name: string;
  } | null;
  isManual: false;
  assignedAt: Date;
  fairnessScore: number; // Score de equidad para mostrar en UI
}

export interface GenerationWarning {
  type: 'INSUFFICIENT_PERSONS' | 'NO_ELIGIBLE' | 'FALLBACK_USED';
  roleName: string;
  sectionName: string;
  message: string;
  needed: number;
  available: number;
}

export interface GenerationStats {
  totalAssigned: number;
  totalNeeded: number;
  coveragePercent: number;
  personsUsed: number;
  scoringBreakdowns?: ScoringBreakdown[]; // Para mostrar en UI (modo debug)
}

export class AssignmentEngine {
  constructor(private rotationWeeks: number = 4) {
    // Rotación simple: solo evitar repeticiones semanales
  }

  /**
   * Genera las asignaciones para UN programa específico.
   *
   * Esta función es pura: no toca req/res ni crea el documento en DB.
   * El controller llama a esta función y luego crea el Program.
   */
  async generateOne(params: GenerationParams): Promise<GenerationResult> {
    const { churchId, activityTypeId, targetDate } = params;

    // ─── CARGA EFICIENTE: Solo 2 queries a la DB ─────────────────────────────
    const lookbackDate = new Date(targetDate);
    lookbackDate.setDate(lookbackDate.getDate() - this.rotationWeeks * 7);

    const [allPersons, recentPrograms, activity] = await Promise.all([
      // Todos los miembros activos de la iglesia (una sola query)
      Person.find({
        churchId,
        status: { $in: ['ACTIVE', 'LEADER'] },
      }) as Promise<IPerson[]>,

      // Programas del período de lookback (una sola query)
      Program.find({
        churchId,
        programDate: { $gte: lookbackDate, $lt: targetDate },
        status: { $in: ['DRAFT', 'PUBLISHED', 'COMPLETED'] },
      }).lean() as unknown as Promise<IProgram[]>,

      // Configuración de la actividad
      ActivityType.findOne({ _id: activityTypeId, churchId }).lean() as unknown as Promise<IActivityType | null>,
    ]);

    if (!activity) {
      throw new Error('Actividad no encontrada');
    }

    // ─── ALGORITMO DE ROTACIÓN SIMPLE ────────────────────────────────────────
    const assignments: AssignmentResult[] = [];
    const warnings: GenerationWarning[] = [];
    const assignedIds = new Set<string>(); // Evitar doble asignación en un mismo programa
    const batchExcluded = params.excludePersonIds || new Set<string>(); // Personas ya asignadas en otros programas del lote
    const allBreakdowns: ScoringBreakdown[] = [];

    // Procesar roles requeridos primero, luego opcionales
    // Filtrar roleConfig inválidos (con role undefined)
    const validRoleConfigs = activity.roleConfig.filter(rc => rc.role && rc.role.id);
    
    const sortedRoleConfigs = [...validRoleConfigs].sort((a, b) => {
      if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1;
      return a.sectionOrder - b.sectionOrder;
    });

    if (validRoleConfigs.length < activity.roleConfig.length) {
      console.warn(`[AssignmentEngine] ${activity.roleConfig.length - validRoleConfigs.length} roleConfig inválidos filtrados en actividad ${activity.name}`);
    }

    for (const roleConfig of sortedRoleConfigs) {
      const roleId = roleConfig.role.id.toString();
      
      console.log(`\n📋 Procesando rol: ${roleConfig.sectionName} (${roleConfig.role.name})`);
      console.log(`   Orden: ${roleConfig.sectionOrder}, Personas necesarias: ${roleConfig.peopleNeeded}, Requerido: ${roleConfig.isRequired}`);
      
      // Encontrar personas que tienen este rol
      const candidates = allPersons.filter(person => 
        person.roles.some(role => 
          role && role.roleId && role.roleId.toString() === roleId
        )
      );
      
      console.log(`   👥 Candidatos con el rol: ${candidates.length}`);
      console.log(`   Nombres: ${candidates.map(p => p.fullName).join(', ') || 'NINGUNO'}`);

      // Filtrar elegibles: disponibles en la fecha, no ya asignados en este programa
      let eligible = candidates.filter(
        (p) =>
          !assignedIds.has(p._id.toString()) &&
          p.isAvailableOn(targetDate)
      );
      
      console.log(`   ✅ Elegibles (disponibles y no asignados): ${eligible.length}`);
      if (eligible.length !== candidates.length) {
        const ineligible = candidates.filter(p => !eligible.includes(p));
        console.log(`   ❌ No elegibles: ${ineligible.map(p => {
          const alreadyAssigned = assignedIds.has(p._id.toString());
          const notAvailable = !p.isAvailableOn(targetDate);
          return `${p.fullName} (${alreadyAssigned ? 'Ya asignado' : ''}${alreadyAssigned && notAvailable ? ', ' : ''}${notAvailable ? 'No disponible' : ''})`;
        }).join(', ')}`);
      }

      // Preferir personas que NO fueron asignadas en otros programas del lote
      // Si no hay suficientes personas "frescas", usar también las ya usadas en el lote
      const freshEligible = eligible.filter(p => !batchExcluded.has(p._id.toString()));
      if (freshEligible.length >= roleConfig.peopleNeeded) {
        eligible = freshEligible;
      }
      // Si no hay suficientes "frescas", mantener la lista completa como fallback

      // Si no hay suficientes, intentar sin restricción de consecutividad extrema (fallback)
      if (eligible.length < roleConfig.peopleNeeded && roleConfig.isRequired) {
        warnings.push({
          type: eligible.length === 0 ? 'NO_ELIGIBLE' : 'INSUFFICIENT_PERSONS',
          roleName: roleConfig.role.name,
          sectionName: roleConfig.sectionName,
          message: `Rol '${roleConfig.role.name}': ${eligible.length} disponibles de ${roleConfig.peopleNeeded} necesarios`,
          needed: roleConfig.peopleNeeded,
          available: eligible.length,
        });
      }

      // ROTACIÓN SIMPLE: todas las personas son iguales, solo evitar repetición semanal
      // Filtrar personas que NO han sido asignadas en las últimas semanas del mes
      const oneMonthAgo = new Date(targetDate);
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

      const recentlyAssignedIds = new Set<string>();
      
      // Obtener personas asignadas en las últimas 4 semanas
      for (const program of recentPrograms) {
        if (program.programDate > oneMonthAgo) {
          for (const assignment of program.assignments || []) {
            if (assignment.person?.id) {
              recentlyAssignedIds.add(assignment.person.id.toString());
            }
          }
        }
      }

      // Priorizar personas que NO han participado recientemente
      const freshCandidates = eligible.filter(p => !recentlyAssignedIds.has(p._id.toString()));
      const availableCandidates = freshCandidates.length >= roleConfig.peopleNeeded 
        ? freshCandidates 
        : eligible; // Si no hay suficientes "frescas", usar todas

      // Selección completamente aleatoria entre candidatos disponibles
      const shuffled = [...availableCandidates];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const selected = shuffled.slice(0, roleConfig.peopleNeeded);
      const backupCandidate = shuffled[roleConfig.peopleNeeded] || null;
      
      console.log(`   🎯 Seleccionados: ${selected.length} de ${roleConfig.peopleNeeded} necesarios`);
      if (selected.length > 0) {
        console.log(`   ✓ Asignados: ${selected.map(p => p.fullName).join(', ')}`);
      } else {
        console.log(`   ⚠️ NO SE PUDO ASIGNAR NADIE PARA ESTE ROL`);
      }

      // Generar breakdowns simples para UI
      const simpleBreakdowns = selected.map(person => ({
        personId: person._id.toString(),
        personName: person.fullName,
        totalScore: 1.0, // Score neutral para todos
        breakdown: {
          participations: 0,
          avgParticipations: 0,
          weeksSinceLastRole: null,
          neverHadRole: false,
          consecutiveWeeks: 0,
        },
      }));
      allBreakdowns.push(...simpleBreakdowns);

      for (const person of selected) {
        assignments.push({
          sectionName: roleConfig.sectionName,
          sectionOrder: roleConfig.sectionOrder,
          roleName: roleConfig.role.name,
          person: {
            id: person._id,
            name: person.fullName,
            phone: person.phone || '',
          },
          backup: backupCandidate
            ? {
                id: backupCandidate._id,
                name: backupCandidate.fullName,
              }
            : null,
          isManual: false as false,
          assignedAt: new Date(),
          fairnessScore: 1.0, // Score neutral para todos
        });
        assignedIds.add(person._id.toString());
      }
    }

    // ─── ESTADÍSTICAS DE LA GENERACIÓN ───────────────────────────────────────
    const totalNeeded = activity.roleConfig.reduce(
      (sum, rc) => sum + rc.peopleNeeded,
      0
    );

    const stats_result: GenerationStats = {
      totalAssigned: assignments.length,
      totalNeeded,
      coveragePercent:
        totalNeeded > 0
          ? Math.round((assignments.length / totalNeeded) * 100)
          : 100,
      personsUsed: assignedIds.size,
      scoringBreakdowns: allBreakdowns,
    };
    
    console.log(`\n📊 RESUMEN DE ASIGNACIÓN:`);
    console.log(`   Total de roles necesarios: ${totalNeeded}`);
    console.log(`   Total asignado: ${assignments.length}`);
    console.log(`   Cobertura: ${stats_result.coveragePercent}%`);
    console.log(`   Personas usadas: ${assignedIds.size}`);
    console.log(`   Advertencias: ${warnings.length}`);
    if (warnings.length > 0) {
      warnings.forEach(w => console.log(`   ⚠️ ${w.message}`));
    }

    return {
      assignments,
      warnings,
      stats: stats_result,
    };
  }

  /**
   * Genera programas para MÚLTIPLES fechas secuencialmente.
   *
   * El orden importa: cada programa generado afecta el historial del siguiente.
   * Se reemplaza el antipatrón de fakeReq/fakeRes original.
   *
   * @returns Array de resultados con éxitos y errores
   */
  async generateBatch(params: {
    churchId: string;
    activityTypeId: string;
    dates: Date[];
    generatedBy: { id: string; name: string };
  }): Promise<BatchResult[]> {
    const results: BatchResult[] = [];

    // Verificar que no existan programas duplicados antes de empezar
    const existing = await Program.find({
      churchId: params.churchId,
      'activityType.id': params.activityTypeId,
      programDate: { $in: params.dates },
    }).select('programDate');

    const existingDates = new Set(
      existing.map((p) => p.programDate.toISOString().split('T')[0])
    );

    // Obtener la actividad UNA vez fuera del loop (incluye defaultTime y schedule)
    const activity = await ActivityType.findOne({
      _id: params.activityTypeId,
      churchId: params.churchId,
    }).select('name defaultTime schedule');

    // Convertir defaultTime (HH:mm 24h) a formato legible (ej: "7:00 PM")
    const formatTime = (time24?: string): string | undefined => {
      if (!time24) return undefined;
      const [h, m] = time24.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    // Función para obtener la hora correcta según el día de la semana
    const getTimeForDay = (date: Date): string | undefined => {
      const dayOfWeek = date.getDay();
      const scheduleEntry = activity?.schedule?.find((s: any) => s.day === dayOfWeek);
      const time24 = scheduleEntry?.time || activity?.defaultTime;
      return formatTime(time24);
    };

    // Tracking global de personas asignadas en el lote para maximizar variedad
    const batchAssignedIds = new Set<string>();

    for (const date of params.dates) {
      const dateKey = date.toISOString().split('T')[0];

      if (existingDates.has(dateKey)) {
        results.push({
          date,
          success: false,
          error: 'Ya existe un programa para esta fecha',
          programId: null,
        });
        continue;
      }

      try {
        const generation = await this.generateOne({
          churchId: params.churchId,
          activityTypeId: params.activityTypeId,
          targetDate: date,
          generatedBy: params.generatedBy,
          excludePersonIds: batchAssignedIds, // Evitar repetición entre programas del lote
        });

        // Agregar las personas asignadas al tracking global del lote
        for (const a of generation.assignments) {
          if (a.person?.id) batchAssignedIds.add(a.person.id.toString());
        }

        // Agregar versículo bíblico aleatorio
        const randomVerse = getRandomVerse();

        const program = await Program.create({
          churchId: params.churchId,
          activityType: {
            id: new mongoose.Types.ObjectId(params.activityTypeId),
            name: activity?.name || '',
          },
          programDate: date,
          programTime: getTimeForDay(date), // Hora según el día de la semana
          defaultTime: getTimeForDay(date), // También guardar en defaultTime
          status: 'DRAFT',
          assignments: generation.assignments,
          notes: `Generado en lote. Cobertura: ${generation.stats.coveragePercent}%`,
          verse: randomVerse.verse,
          verseText: randomVerse.verseText,
          generatedBy: params.generatedBy,
        });

        results.push({
          date,
          success: true,
          programId: program._id.toString(),
          warnings: generation.warnings,
          stats: generation.stats,
          error: null,
        });
      } catch (error: any) {
        results.push({
          date,
          success: false,
          error: error.message || 'Error desconocido',
          programId: null,
        });
      }
    }

    return results;
  }
}

export interface BatchResult {
  date: Date;
  success: boolean;
  programId: string | null;
  error: string | null;
  warnings?: GenerationWarning[];
  stats?: GenerationStats;
}

import mongoose from 'mongoose';
import Person, { IPerson } from '../../../models/Person.model';
import Program, { IProgram } from '../../../models/Program.model';
import ActivityType, { IActivityType, IActivityRoleConfig } from '../../../models/ActivityType.model';
import { HistoryAnalyzer } from './HistoryAnalyzer';
import { FairnessCalculator, ScoringBreakdown } from './FairnessCalculator';

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
  private calculator: FairnessCalculator;

  constructor(private rotationWeeks: number = 4) {
    this.calculator = new FairnessCalculator(rotationWeeks);
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
      }).lean() as Promise<IProgram[]>,

      // Configuración de la actividad
      ActivityType.findOne({ _id: activityTypeId, churchId }).lean() as Promise<IActivityType | null>,
    ]);

    if (!activity) {
      throw new Error('Actividad no encontrada');
    }

    // ─── INDEXADO EN MEMORIA: lookup en O(1) ─────────────────────────────────
    const stats = HistoryAnalyzer.build(recentPrograms, targetDate);

    // Índice de personas por roleId para evitar filter() repetitivo
    const personsByRole = new Map<string, IPerson[]>();
    for (const person of allPersons) {
      for (const role of person.roles) {
        const key = role.roleId.toString();
        if (!personsByRole.has(key)) {
          personsByRole.set(key, []);
        }
        personsByRole.get(key)!.push(person);
      }
    }

    // ─── ALGORITMO DE ASIGNACIÓN ──────────────────────────────────────────────
    const assignments: AssignmentResult[] = [];
    const warnings: GenerationWarning[] = [];
    const assignedIds = new Set<string>(); // Evitar doble asignación en un mismo programa
    const batchExcluded = params.excludePersonIds || new Set<string>(); // Personas ya asignadas en otros programas del lote
    const allBreakdowns: ScoringBreakdown[] = [];

    // Procesar roles requeridos primero, luego opcionales
    const sortedRoleConfigs = [...activity.roleConfig].sort((a, b) => {
      if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1;
      return a.sectionOrder - b.sectionOrder;
    });

    for (const roleConfig of sortedRoleConfigs) {
      const roleId = roleConfig.role.id.toString();
      const candidates = personsByRole.get(roleId) || [];

      // Filtrar elegibles: disponibles en la fecha, no ya asignados en este programa
      let eligible = candidates.filter(
        (p) =>
          !assignedIds.has(p._id.toString()) &&
          p.isAvailableOn(targetDate)
      );

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

      // Calcular score para cada candidato elegible
      const scored = eligible
        .map((person) => ({
          person,
          score: this.calculator.calculate(
            person,
            roleConfig.role.name,
            targetDate,
            stats
          ),
          breakdown: this.calculator.explain(
            person,
            roleConfig.role.name,
            targetDate,
            stats
          ),
        }))
        .sort((a, b) => b.score - a.score); // Mayor score primero

      // Guardar breakdowns para debugging/UI
      allBreakdowns.push(...scored.map((s) => s.breakdown));

      // Seleccionar los N necesarios
      const selected = scored.slice(0, roleConfig.peopleNeeded);
      const backupCandidate = scored[roleConfig.peopleNeeded] || null;

      for (const { person, score } of selected) {
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
                id: backupCandidate.person._id,
                name: backupCandidate.person.fullName,
              }
            : null,
          isManual: false as false,
          assignedAt: new Date(),
          fairnessScore: Math.round(score * 100) / 100,
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

    // Obtener la actividad UNA vez fuera del loop (incluye defaultTime)
    const activity = await ActivityType.findOne({
      _id: params.activityTypeId,
      churchId: params.churchId,
    }).select('name defaultTime');

    // Convertir defaultTime (HH:mm 24h) a formato legible (ej: "7:00 PM")
    const formatTime = (time24?: string): string | undefined => {
      if (!time24) return undefined;
      const [h, m] = time24.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    const programTime = formatTime(activity?.defaultTime);

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

        const program = await Program.create({
          churchId: params.churchId,
          activityType: {
            id: new mongoose.Types.ObjectId(params.activityTypeId),
            name: activity?.name || '',
          },
          programDate: date,
          programTime, // Hora por defecto de la actividad
          status: 'DRAFT',
          assignments: generation.assignments,
          notes: `Generado en lote. Cobertura: ${generation.stats.coveragePercent}%`,
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

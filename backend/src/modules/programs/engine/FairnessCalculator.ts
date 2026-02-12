import { IPerson } from '../../../models/Person.model';
import { ParticipationStats } from './HistoryAnalyzer';

/**
 * FAIRNESS CALCULATOR — Paso 3: Algoritmo de Puntuación Corregido
 *
 * PROBLEMA DEL ALGORITMO ORIGINAL:
 * ─────────────────────────────────
 * score = participations * 10 - daysSinceLastRole * 2 - priority * 3
 *
 * Bug: Con 0 participaciones y nunca asignado:
 *   score = 0*10 - 999*2 - 1*3 = -2001  ← el MENOS usado
 *
 * Con 5 participaciones y último hace 10 días:
 *   score = 50 - 20 - 15 = +15  ← el MÁS usado
 *
 * Resultado: el más activo se selecciona ANTES que el nuevo. Lógica invertida.
 *
 * SOLUCIÓN — Score Normalizado por Componentes:
 * ──────────────────────────────────────────────
 * Score final = (carga * -0.40) + (gap_de_rol * 0.35) + (penalización_consecutiva * -0.25) + bonus_prioridad
 *
 * Mayor score → debe ser asignado primero.
 * Rango aproximado: -1.35 a +1.35
 */
export class FairnessCalculator {
  constructor(private rotationWeeks: number = 4) {}

  /**
   * Calcula el fairness score para una persona en un rol específico.
   *
   * @param person       - La persona a puntuar
   * @param roleName     - Nombre del rol (clave para buscar última fecha)
   * @param targetDate   - Fecha del nuevo programa
   * @param stats        - Estadísticas pre-calculadas por HistoryAnalyzer
   * @returns            - Score (mayor = más prioridad para ser asignado)
   */
  calculate(
    person: IPerson,
    roleName: string,
    targetDate: Date,
    stats: ParticipationStats
  ): number {
    const pid = person._id.toString();

    // ─────────────────────────────────────────────────────────────
    // COMPONENTE 1: Equidad de Carga (peso: 40%)
    // Cuánto ha participado esta persona vs el promedio del grupo.
    // Menos que el promedio → score más alto → asignar primero.
    // ─────────────────────────────────────────────────────────────
    const personParticipations = stats.participationCount.get(pid) || 0;
    const avg = stats.avgParticipations;
    const maxDelta = Math.max(stats.maxParticipations - avg, avg, 1);
    const loadDelta = personParticipations - avg;
    // normalizado: -1 (muy por debajo del promedio) a +1 (muy por encima)
    const normalizedLoad = maxDelta > 0 ? loadDelta / maxDelta : 0;
    // Invertir: menos participación → score más alto
    const loadScore = -normalizedLoad * 0.40;

    // ─────────────────────────────────────────────────────────────
    // COMPONENTE 2: Tiempo desde último turno en este rol (peso: 35%)
    // Nunca asignado → máxima prioridad (1.0).
    // Cuanto más tiempo sin este rol → mayor score.
    // ─────────────────────────────────────────────────────────────
    const roleKey = `${pid}-${roleName}`;
    const lastDate = stats.lastRoleDate.get(roleKey);

    let roleGapScore: number;
    if (!lastDate) {
      // Nunca ha tenido este rol → máxima prioridad
      roleGapScore = 1.0 * 0.35;
    } else {
      const weeksSinceRole =
        (targetDate.getTime() - lastDate.getTime()) / (7 * 24 * 3600 * 1000);
      // Cap en 1.0 cuando supera el período de rotación configurado
      const normalized = Math.min(weeksSinceRole / this.rotationWeeks, 1.0);
      roleGapScore = normalized * 0.35;
    }

    // ─────────────────────────────────────────────────────────────
    // COMPONENTE 3: Penalización por semanas consecutivas (peso: 25%)
    // 0 consecutivas → sin penalización
    // 1 semana seguida → penalización leve (0.2)
    // 2 semanas seguidas → penalización alta (0.6)
    // 3+ semanas → bloqueo casi total (1.0)
    // ─────────────────────────────────────────────────────────────
    const consecutive = stats.consecutiveWeeks.get(pid) || 0;
    const penalties = [0, 0.2, 0.6, 1.0];
    const penaltyIndex = Math.min(consecutive, 3);
    const consecutiveScore = -penalties[penaltyIndex] * 0.25;

    // ─────────────────────────────────────────────────────────────
    // BONUS: Prioridad explícita de la persona (±5%)
    // Priority 1-10: persona con priority=10 tiene +5%, con priority=1 tiene -5%
    // Es un modificador fino, no domina la decisión.
    // ─────────────────────────────────────────────────────────────
    const priorityBonus = ((person.priority - 5) / 10) * 0.10;

    const finalScore = loadScore + roleGapScore + consecutiveScore + priorityBonus;

    return finalScore;
  }

  /**
   * Retorna un resumen legible del score para debugging y UI.
   */
  explain(
    person: IPerson,
    roleName: string,
    targetDate: Date,
    stats: ParticipationStats
  ): ScoringBreakdown {
    const pid = person._id.toString();
    const personParticipations = stats.participationCount.get(pid) || 0;
    const avg = stats.avgParticipations;
    const maxDelta = Math.max(stats.maxParticipations - avg, avg, 1);
    const loadDelta = personParticipations - avg;
    const normalizedLoad = maxDelta > 0 ? loadDelta / maxDelta : 0;

    const roleKey = `${pid}-${roleName}`;
    const lastDate = stats.lastRoleDate.get(roleKey);
    const weeksSinceRole = lastDate
      ? (targetDate.getTime() - lastDate.getTime()) / (7 * 24 * 3600 * 1000)
      : null;

    const consecutive = stats.consecutiveWeeks.get(pid) || 0;
    const totalScore = this.calculate(person, roleName, targetDate, stats);

    return {
      personId: pid,
      personName: person.fullName,
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: {
        participations: personParticipations,
        avgParticipations: Math.round(avg * 10) / 10,
        weeksSinceLastRole: weeksSinceRole !== null ? Math.round(weeksSinceRole * 10) / 10 : null,
        neverHadRole: !lastDate,
        consecutiveWeeks: consecutive,
      },
    };
  }
}

export interface ScoringBreakdown {
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

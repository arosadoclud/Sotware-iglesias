import mongoose from 'mongoose';
import { IProgram } from '../../../models/Program.model';

/**
 * HISTORY ANALYZER — Paso 3: Motor de Asignación v2
 *
 * Analiza el historial de programas recientes y construye
 * índices en memoria para que el AssignmentEngine los use en O(1).
 *
 * Problema original: el controller hacía queries dentro de loops.
 * Solución: pre-cargar todo de una vez, indexar en memoria.
 */

export interface ParticipationStats {
  // Total de asignaciones por persona en el período analizado
  participationCount: Map<string, number>;

  // Promedio y máximo de participaciones (para normalización)
  avgParticipations: number;
  maxParticipations: number;

  // Última fecha asignada por persona+rol: clave = `${personId}-${roleId}`
  lastRoleDate: Map<string, Date>;

  // Cuántas semanas consecutivas fue asignada cada persona
  consecutiveWeeks: Map<string, number>;

  // Lista de personIds asignados en cada semana reciente (para calcular consecutivos)
  weeklyAssigned: Map<string, Set<string>>; // clave = ISO semana (YYYY-WW)
}

export class HistoryAnalyzer {
  /**
   * Construye las estadísticas de participación a partir de programas recientes.
   *
   * @param recentPrograms - Programas del período de lookback (ya cargados desde DB)
   * @param targetDate     - Fecha del nuevo programa que se va a generar
   */
  static build(recentPrograms: IProgram[], targetDate: Date): ParticipationStats {
    const participationCount = new Map<string, number>();
    const lastRoleDate = new Map<string, Date>();
    const weeklyAssigned = new Map<string, Set<string>>();

    // Construir mapas de participación y últimas fechas por rol
    for (const prog of recentPrograms) {
      const weekKey = HistoryAnalyzer.getISOWeek(prog.programDate);

      if (!weeklyAssigned.has(weekKey)) {
        weeklyAssigned.set(weekKey, new Set());
      }

      for (const assignment of prog.assignments) {
        const pid = assignment.person.id.toString();
        const roleId = assignment.roleName; // Usamos roleName como clave (disponible en assignments)

        // Contar participaciones totales
        participationCount.set(pid, (participationCount.get(pid) || 0) + 1);

        // Registrar si estuvo en esta semana
        weeklyAssigned.get(weekKey)!.add(pid);

        // Guardar última fecha para este rol específico
        const roleKey = `${pid}-${roleId}`;
        const existing = lastRoleDate.get(roleKey);
        if (!existing || prog.programDate > existing) {
          lastRoleDate.set(roleKey, prog.programDate);
        }
      }
    }

    // Calcular promedio y máximo de participaciones
    const counts = [...participationCount.values()];
    const avgParticipations = counts.length > 0
      ? counts.reduce((a, b) => a + b, 0) / counts.length
      : 0;
    const maxParticipations = counts.length > 0 ? Math.max(...counts) : 0;

    // Calcular semanas consecutivas hasta la semana anterior al targetDate
    const consecutiveWeeks = HistoryAnalyzer.calculateConsecutiveWeeks(
      weeklyAssigned,
      targetDate
    );

    return {
      participationCount,
      avgParticipations,
      maxParticipations,
      lastRoleDate,
      consecutiveWeeks,
      weeklyAssigned,
    };
  }

  /**
   * Calcula cuántas semanas consecutivas (contando hacia atrás desde targetDate)
   * fue asignada cada persona.
   *
   * Ejemplo: si hoy es semana 10 y una persona estuvo en 9, 8 y 7 → consecutiveWeeks = 3
   */
  private static calculateConsecutiveWeeks(
    weeklyAssigned: Map<string, Set<string>>,
    targetDate: Date
  ): Map<string, number> {
    const result = new Map<string, number>();

    // Obtener todas las semanas previas ordenadas descendente
    const sortedWeeks = [...weeklyAssigned.keys()].sort().reverse();
    if (sortedWeeks.length === 0) return result;

    // Construir la secuencia de semanas esperada (consecutivas) antes del target
    const targetWeek = HistoryAnalyzer.getISOWeek(targetDate);
    const weeksBefore: string[] = [];
    let cursor = new Date(targetDate);
    cursor.setDate(cursor.getDate() - 7); // Empezar en la semana anterior

    for (let i = 0; i < sortedWeeks.length; i++) {
      weeksBefore.push(HistoryAnalyzer.getISOWeek(cursor));
      cursor.setDate(cursor.getDate() - 7);
    }

    // Para cada persona, contar semanas consecutivas hacia atrás
    const allPersonIds = new Set<string>();
    weeklyAssigned.forEach(persons => persons.forEach(pid => allPersonIds.add(pid)));

    for (const pid of allPersonIds) {
      let consecutive = 0;
      for (const week of weeksBefore) {
        const assigned = weeklyAssigned.get(week);
        if (assigned && assigned.has(pid)) {
          consecutive++;
        } else {
          break; // Se rompe la consecutividad → parar
        }
      }
      if (consecutive > 0) {
        result.set(pid, consecutive);
      }
    }

    return result;
  }

  /**
   * Genera una clave de semana ISO (YYYY-WW) para agrupar programas por semana.
   */
  static getISOWeek(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  }
}

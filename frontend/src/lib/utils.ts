import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte un string de fecha (ISO o YYYY-MM-DD) a un objeto Date seguro
 * que preserva el día correcto sin importar la timezone.
 * Ejemplo: "2026-02-18T00:00:00.000Z" → Date(2026-02-18 12:00 local)
 */
export function safeDateParse(dateVal: string | Date): Date {
  if (dateVal instanceof Date) {
    // Si ya es un Date, extraer YYYY-MM-DD en UTC y reconstruir al mediodía local
    const iso = dateVal.toISOString().slice(0, 10)
    return new Date(iso + 'T12:00:00')
  }
  if (!dateVal) return new Date(NaN)
  // Extraer solo la parte YYYY-MM-DD del string
  const dateOnly = dateVal.includes('T') ? dateVal.slice(0, 10) : dateVal.slice(0, 10)
  return new Date(dateOnly + 'T12:00:00')
}

/**
 * Extrae el string YYYY-MM-DD de cualquier formato de fecha
 * sin desfase de timezone.
 */
export function toDateStr(dateVal: string): string {
  if (!dateVal) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal
  if (dateVal.includes('T')) return dateVal.slice(0, 10)
  return dateVal
}

export function formatDate(date: Date | string): string {
  const d = safeDateParse(typeof date === 'string' ? date : date.toISOString())
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Santo_Domingo'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Santo_Domingo'
  })
}

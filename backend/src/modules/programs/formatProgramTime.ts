/** Accept stored 24-hour values or values already carrying an AM/PM suffix. */
export function formatProgramTime(time: string, period?: string): string {
  const match = String(time || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2] || '0');
  if (hour > 23 || minute > 59) return '';
  const suffix = match[3]?.toUpperCase() || (hour > 12 || hour === 0 ? (hour >= 12 ? 'PM' : 'AM') : period?.toUpperCase() || (hour >= 12 ? 'PM' : 'AM'));
  return `${hour % 12 || 12}:${String(minute).padStart(2,'0')} ${suffix}`;
}

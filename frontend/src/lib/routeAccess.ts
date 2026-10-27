import { P } from '../constants/permissions'

const routePermissions: [string, string][] = [
  ['/programs/generate', P.PROGRAMS_GENERATE],
  ['/programs', P.PROGRAMS_VIEW],
  ['/persons', P.PERSONS_VIEW],
  ['/activities', P.ACTIVITIES_VIEW],
  ['/flyer-assistant', P.ACTIVITIES_VIEW],
  ['/events', P.ACTIVITIES_VIEW],
  ['/calendar', P.CALENDAR_VIEW],
  ['/estudios-biblicos/admin', P.BIBLE_STUDIES_CREATE],
  ['/estudios-biblicos', P.BIBLE_STUDIES_VIEW],
  ['/letters', P.LETTERS_VIEW],
  ['/secretaria', P.SECRETARY_VIEW],
  ['/pastoral', P.PASTORAL_VIEW],
  ['/asistencias', P.ATTENDANCE_VIEW],
  ['/finances/reports', P.FINANCES_REPORTS],
  ['/finances', P.FINANCES_VIEW],
  ['/settings', P.SETTINGS_VIEW],
  ['/admin/users', P.USERS_VIEW],
  ['/admin/audit', P.AUDIT_VIEW],
]

export function canAccessRoute(pathname: string, hasPermission: (permission: string) => boolean): boolean {
  const route = routePermissions.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  return !route || hasPermission(route[1])
}

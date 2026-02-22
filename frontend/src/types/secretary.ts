export interface ChildPresentation {
  _id: string
  churchId: string
  childName: string
  birthDate?: string
  fatherName?: string
  motherName?: string
  address?: string
  presentationDate: string
  officiant?: string
  notes?: string
  createdBy?: string
  createdAt: string
}

export interface Wedding {
  _id: string
  churchId: string
  groomName: string
  brideName: string
  weddingDate: string
  location?: string
  officiant?: string
  witnesses?: string[]
  certificateNumber?: string
  notes?: string
  createdAt: string
}

export interface Baptism {
  _id: string
  churchId: string
  personName: string
  birthDate?: string
  baptismDate: string
  officiant?: string
  location?: string
  notes?: string
  createdAt: string
}

export interface Conversion {
  _id: string
  churchId: string
  personName: string
  conversionDate: string
  context?: 'Culto' | 'Actividad especial' | 'Visita pastoral' | 'Otro'
  officiant?: string
  followUpPerson?: string
  notes?: string
  createdAt: string
}

export interface BoardMinutes {
  _id: string
  churchId: string
  meetingDate: string
  attendees?: string[]
  topics: string
  agreements?: string
  nextMeetingDate?: string
  recordedBy?: string
  notes?: string
  createdAt: string
}

export interface Preacher {
  _id: string
  churchId: string
  fullName: string
  phone?: string
  email?: string
  ministry?: string
  topics?: string
  bio?: string
  notes?: string
  lastVisit?: string
  createdAt: string
}

export type SecretaryResource =
  | 'child-presentations'
  | 'weddings'
  | 'baptisms'
  | 'conversions'
  | 'board-minutes'
  | 'preachers'

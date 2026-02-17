import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

// Exportar la URL base del backend (sin /api/v1) para acceder a archivos estáticos
export const BACKEND_URL = API_URL.replace('/api/v1', '')

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      // ProtectedRoute detectará isAuthenticated=false y redirigirá a /login
    }
    return Promise.reject(error)
  }
)

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
  updateProfile: (data: { fullName: string }) => api.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/auth/change-password', data),
}

// ── CHURCHES ──────────────────────────────────────────────────────────────────
export const churchesApi = {
  getMine: () => api.get('/churches/mine'),
  updateMine: (data: any) => api.put('/churches/mine', data),
  uploadLogo: (file: File) => {
    const formData = new FormData()
    formData.append('logo', file)
    return api.post('/churches/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadSignature: (file: File) => {
    const formData = new FormData()
    formData.append('signature', file)
    return api.post('/churches/signature', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ── ROLES ─────────────────────────────────────────────────────────────────────
export const rolesApi = {
  getAll: () => api.get('/roles'),
  create: (data: any) => api.post('/roles', data),
  update: (id: string, data: any) => api.put(`/roles/${id}`, data),
  delete: (id: string) => api.delete(`/roles/${id}`),
}

// ── PERSONS ───────────────────────────────────────────────────────────────────
export const personsApi = {
  getAll: (params?: any) => api.get('/persons', { params }),
  get: (id: string) => api.get(`/persons/${id}`),
  create: (data: any) => api.post('/persons', data),
  update: (id: string, data: any) => api.put(`/persons/${id}`, data),
  delete: (id: string) => api.delete(`/persons/${id}`),
}

// ── MINISTRIES ────────────────────────────────────────────────────────────────
export const ministriesApi = {
  getAll: () => api.get('/persons/ministries'),
  create: (data: { name: string; description?: string; color?: string }) =>
    api.post('/persons/ministries', data),
  update: (id: string, data: { name?: string; description?: string; color?: string }) =>
    api.put(`/persons/ministries/${id}`, data),
  delete: (id: string) => api.delete(`/persons/ministries/${id}`),
  seed: () => api.post('/persons/ministries/seed'),
}

// ── PERSON STATUSES ───────────────────────────────────────────────────────────
export const personStatusesApi = {
  getAll: () => api.get('/person-statuses'),
  getAllIncludingInactive: () => api.get('/person-statuses/all'),
  create: (data: { name: string; color?: string; description?: string }) =>
    api.post('/person-statuses', data),
  update: (id: string, data: any) => api.put(`/person-statuses/${id}`, data),
  delete: (id: string) => api.delete(`/person-statuses/${id}`),
  seed: () => api.post('/person-statuses/seed'),
}

// ── ACTIVITIES ────────────────────────────────────────────────────────────────
export const activitiesApi = {
  getAll: (params?: any) => api.get('/activities', { params }),
  get: (id: string) => api.get(`/activities/${id}`),
  create: (data: any) => api.post('/activities', data),
  update: (id: string, data: any) => api.put(`/activities/${id}`, data),
  delete: (id: string) => api.delete(`/activities/${id}`),
}

// ── PROGRAMS ──────────────────────────────────────────────────────────────────
export const programsApi = {
  getAll: (params?: any) => api.get('/programs', { params }),
  get: (id: string) => api.get(`/programs/${id}`),
  generate: (data: any) => api.post('/programs/generate', data),
  generateBatch: (data: any) => api.post('/programs/generate-batch', data),
  update: (id: string, data: any) => api.put(`/programs/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/programs/${id}/status`, { status }),
  updateAssignment: (id: string, data: any) =>
    api.patch(`/programs/${id}/assignments`, data),
  delete: (id: string) => api.delete(`/programs/${id}`),
  deleteAll: () => api.delete('/programs/all'),
  publishAll: () => api.patch('/programs/publish-all'),
  getStats: () => api.get('/programs/stats'),
  previewScoring: (params: { activityTypeId: string; programDate: string }) =>
    api.get('/programs/preview-scoring', { params }),
  // PASO 5: PDF
    downloadPdf: (id: string, summary?: string) =>
      api.get(`/programs/${id}/pdf${summary ? `?summary=${encodeURIComponent(summary)}` : ''}`, { responseType: 'blob' }),
    downloadFlyer: (id: string) =>
      api.get(`/programs/${id}/flyer`, { responseType: 'blob' }),
  previewPdf: (id: string) =>
    `${API_URL}/programs/${id}/pdf/preview`,
    getFlyerHtml: (id: string, summary?: string) =>
      api.get(`/programs/${id}/pdf/preview${summary ? `?summary=${encodeURIComponent(summary)}` : ''}`, { responseType: 'text' }),
  // Obtener URL pública del PDF para compartir
  getPdfUrl: (id: string) =>
    api.get<{ success: boolean; data: { url: string; filename: string; programId: string } }>(`/programs/${id}/pdf/url`),
}

// ── LETTERS ───────────────────────────────────────────────────────────────────
export const lettersApi = {
  getTemplates: () => api.get('/letters/templates'),
  getTemplate: (id: string) => api.get(`/letters/templates/${id}`),
  createTemplate: (data: any) => api.post('/letters/templates', data),
  updateTemplate: (id: string, data: any) =>
    api.put(`/letters/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/letters/templates/${id}`),
  getGenerated: () => api.get('/letters/generated'),
  generate: (data: any) => api.post('/letters/generate', data),
  deleteGenerated: (id: string) => api.delete(`/letters/generated/${id}`),
  downloadPdf: (data: { 
    content: string; 
    title: string; 
    recipientName?: string;
    churchData?: {
      nombre?: string;
      direccion?: string;
      telefono?: string;
      pastor?: string;
      tituloPastor?: string;
    };
    eventData?: {
      fecha?: string;
      tema?: string;
      hora?: string;
      iglesiaDestinatario?: string;
      pastorDestinatario?: string;
    };
  }) => api.post('/letters/download-pdf', data, { responseType: 'blob' }),
}

// ── ADMIN / USERS ─────────────────────────────────────────────────────────────
export const adminApi = {
  // Usuarios
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }) =>
    api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  createUser: (data: {
    email: string;
    password: string;
    fullName: string;
    role?: string;
    permissions?: string[];
    useCustomPermissions?: boolean;
  }) => api.post('/admin/users', data),
  updateUser: (id: string, data: {
    fullName?: string;
    role?: string;
    isActive?: boolean;
    permissions?: string[];
    useCustomPermissions?: boolean;
  }) => api.put(`/admin/users/${id}`, data),
  updateUserPermissions: (id: string, data: {
    permissions: string[];
    useCustomPermissions?: boolean;
  }) => api.put(`/admin/users/${id}/permissions`, data),
  resetUserPassword: (id: string, newPassword: string) =>
    api.post(`/admin/users/${id}/reset-password`, { newPassword }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  activateUser: (id: string) => api.post(`/admin/users/${id}/activate`),
  
  // Permisos disponibles
  getPermissions: () => api.get('/admin/permissions'),
}

// ── AUDIT ─────────────────────────────────────────────────────────────────────
export const auditApi = {
  getLogs: (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    resourceType?: string;
    severity?: string;
  }) => api.get('/admin/audit/logs', { params }),
  getStats: (params?: { days?: number }) => api.get('/admin/audit/stats', { params }),
}

// ── FINANCES ──────────────────────────────────────────────────────────────────
export const financesApi = {
  // Categorías
  getCategories: (params?: { type?: string; active?: boolean }) => 
    api.get('/finances/categories', { params }),
  seedCategories: () => api.post('/finances/categories/seed'),
  createCategory: (data: { 
    name: string; 
    code: string; 
    type: 'INCOME' | 'EXPENSE'; 
    description?: string; 
    color?: string 
  }) => api.post('/finances/categories', data),
  
  // Fondos
  getFunds: (params?: { active?: boolean }) => 
    api.get('/finances/funds', { params }),
  seedFunds: () => api.post('/finances/funds/seed'),
  createFund: (data: { 
    name: string; 
    code: string; 
    description?: string; 
    color?: string; 
    goal?: number;
    isRestricted?: boolean 
  }) => api.post('/finances/funds', data),
  
  // Transacciones
  getTransactions: (params?: {
    type?: string;
    category?: string;
    fund?: string;
    startDate?: string;
    endDate?: string;
    person?: string;
    approvalStatus?: string;
    page?: number;
    limit?: number;
  }) => api.get('/finances/transactions', { params }),
  createTransaction: (data: {
    type: 'INCOME' | 'EXPENSE';
    category: string;
    fund: string;
    amount: number;
    date?: string;
    description?: string;
    person?: string;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
  }) => api.post('/finances/transactions', data),
  approveTransaction: (id: string, data: { approved: boolean; notes?: string }) =>
    api.patch(`/finances/transactions/${id}/approve`, data),
  deleteTransaction: (id: string) => api.delete(`/finances/transactions/${id}`),
  
  // Reportes
  getSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/finances/summary', { params }),
  getTithingReport: (params?: { personId?: string; year?: number }) =>
    api.get('/finances/reports/tithing', { params }),
  getCouncilReport: (params?: { month?: number; year?: number }) =>
    api.get('/finances/reports/council', { params }),
  getOfferingsReport: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/finances/reports/offerings', { params }),
  getMonthlyComparison: (params?: { months?: number }) =>
    api.get('/finances/reports/monthly-comparison', { params }),
  getAnnualReport: (params?: { year?: number }) =>
    api.get('/finances/reports/annual', { params }),
  getDetailedTransactions: (params?: { 
    startDate?: string; 
    endDate?: string;
    type?: string;
    category?: string;
    fund?: string;
  }) => api.get('/finances/reports/transactions', { params }),
}

// ── NEW MEMBERS (Seguimiento) ─────────────────────────────────────────────────
export const newMembersApi = {
  getAll: (params?: any) => api.get('/new-members', { params }),
  get: (id: string) => api.get(`/new-members/${id}`),
  create: (data: any) => api.post('/new-members', data),
  update: (id: string, data: any) => api.put(`/new-members/${id}`, data),
  delete: (id: string) => api.delete(`/new-members/${id}`),
  addFollowUp: (id: string, data: any) => api.post(`/new-members/${id}/follow-up`, data),
  updatePhase: (id: string, phase: string) => api.patch(`/new-members/${id}/phase`, { phase }),
  scheduleAlert: (id: string, data: any) => api.post(`/new-members/${id}/alerts`, data),
  deleteAlert: (id: string, alertId: string) => api.delete(`/new-members/${id}/alerts/${alertId}`),
  convertToPerson: (id: string, data?: any) => api.post(`/new-members/${id}/convert`, data || {}),
  sendWhatsApp: (id: string, message: string) => api.post(`/new-members/${id}/whatsapp`, { message }),
  getStats: () => api.get('/new-members/stats'),
}

// ── EVENTS (Imágenes y eventos) ───────────────────────────────────────────────
export const eventsApi = {
  getAll: (params?: {
    type?: 'event' | 'flyer' | 'announcement' | 'all'
    isActive?: string
    limit?: number
    sort?: string
  }) => api.get('/events', { params }),
  get: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  reorder: (events: { id: string; order: number }[]) => 
    api.put('/events/reorder', { events }),
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/events/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteImage: (filename: string) => api.delete(`/events/upload/${filename}`),
}

export default api

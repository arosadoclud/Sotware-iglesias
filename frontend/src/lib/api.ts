import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

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
      window.location.href = '/login'
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
}

export default api

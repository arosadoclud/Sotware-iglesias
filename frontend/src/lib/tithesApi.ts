import { api } from './api'

export const tithesApi = {
  getMonthlyTithesDetails: (params: { startDate: string; endDate: string }) =>
    api.get('/finances/tithes-details', { params }),
}

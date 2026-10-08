import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  // Session cookie is httpOnly; the custom header proves the call came from our JS (CSRF guard)
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const childAPI = {
  list: (params) => api.get('/child', { params }),
  get: (id) => api.get(`/child/${id}`),
  add: (data) => api.post('/child/add', data),
  update: (id, data) => api.put(`/child/update/${id}`, data),
};

export const growthAPI = {
  add: (data) => api.post('/growth/add', data),
  getHistory: (childId) => api.get(`/growth/${childId}`),
  // insights=false skips the LLM write-up (seconds of CPU) when the page doesn't display it
  getPrediction: (childId, { insights = true } = {}) => api.get(`/growth/${childId}/predict`, { params: insights ? {} : { insights: 'false' } }),
};

export const vaccinationAPI = {
  getSchedule: (childId) => api.get(`/vaccination/${childId}`),
  update: (data) => api.put('/vaccination/update', data),
  getOverdue: () => api.get('/vaccination/overdue'),
  parentMarkDone: (vaccineId) => api.put('/vaccination/parent-mark-done', { vaccineId }),
};

export const ashaAPI = {
  getProfile: () => api.get('/asha/profile'),
  getMyChildren: () => api.get('/asha/children'),
  logVisit: (data) => api.post('/asha/visit', data),
  getVisits: () => api.get('/asha/visits'),
  listWorkers: () => api.get('/asha/workers'),
  assignChild: (data) => api.post('/asha/assign', data),
  unassignChild: (data) => api.post('/asha/unassign', data),
  getCheckupQueue: () => api.get('/asha/checkup-queue'),
  toggleCheckupQueue: (data) => api.post('/asha/checkup-queue', data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getHeatmap: () => api.get('/admin/heatmap'),
  listUsers: (role) => api.get('/admin/users', { params: { role } }),
  toggleUser: (id) => api.put(`/admin/user/${id}/toggle`),
  getMalnutrition: (status) => api.get('/admin/malnutrition', { params: { status } }),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export const schemeAPI = {
  list: () => api.get('/schemes'),
  create: (data) => api.post('/schemes', data),
  update: (id, data) => api.put(`/schemes/${id}`, data),
};

export const notificationAPI = {
  list: () => api.get('/notifications'),
  send: (data) => api.post('/notifications/send', data),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const reportAPI = {
  childPDF: (childId, type = 'comprehensive') => api.get(`/reports/child/${childId}`, { params: { type }, responseType: 'blob' }),
  districtExcel: (districtId) => api.get(`/reports/district/${districtId}`, { responseType: 'blob' }),
};

export const dietAPI = {
  getByAgeGroup: (ageGroup) => api.get(`/diet/${ageGroup}`),
  getByAge: (months) => api.get(`/diet/age/${months}`),
};

export const chatbotAPI = {
  query: (message, history = [], language = 'English', location = null) =>
    api.post('/chatbot/query', { message, history, language, location }),
};

export const dietChecklistAPI = {
  get: (childId, date) => api.get('/diet/checklist', { params: { childId, date } }),
  save: (data) => api.put('/diet/checklist', data),
  streak: (childId) => api.get('/diet/checklist/streak', { params: { childId } }),
};

export const hospitalAPI = {
  nearby: (lat, lng, radius = 30000, type = 'all') =>
    api.get('/hospitals/nearby', { params: { lat, lng, radius, type } }),
  search: (q, lat, lng) =>
    api.get('/hospitals/search', { params: { q, lat, lng } }),
  list: (params) => api.get('/hospitals', { params }),
  emergency: (lat, lng) => api.get('/hospitals/emergency', { params: { lat, lng } }),
};

export const searchAPI = {
  parentSearchChildren: (q) => api.get('/child/search/parent', { params: { q } }),
  ashaSearchChild: (childId) => api.get('/child/search/asha', { params: { childId } }),
  adminSearchAsha: (q) => api.get('/admin/search/asha', { params: { q } }),
};

export const statsAPI = {
  public: () => api.get('/stats/public'),
};

export default api;

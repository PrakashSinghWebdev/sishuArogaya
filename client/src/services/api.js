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
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePreferences: (notificationPrefs) => api.put('/auth/preferences', { notificationPrefs }),
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
  getOverdue: (params) => api.get('/vaccination/overdue', { params }),
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
  getVisitPlan: () => api.get('/asha/visit-plan'),
  getFamilies: () => api.get('/asha/families'),
  search: (q) => api.get('/asha/search', { params: { q } }),
  getDashboard: () => api.get('/asha/dashboard'),
  getVaccinationStatus: () => api.get('/asha/vaccination-status'),
  getReport: (month) => api.get('/asha/report', { params: { month } }),
  downloadReport: (month) => api.get('/asha/report', { params: { month, format: 'xlsx' }, responseType: 'blob' }),
};

export const maternalAPI = {
  list: (params) => api.get('/maternal', { params }),
  get: (id) => api.get(`/maternal/${id}`),
  register: (data) => api.post('/maternal', data),
  update: (id, data) => api.patch(`/maternal/${id}`, data),
  addAnc: (id, data) => api.post(`/maternal/${id}/anc`, data),
  recordDelivery: (id, data) => api.post(`/maternal/${id}/delivery`, data),
  addPnc: (id, data) => api.post(`/maternal/${id}/pnc`, data),
};

export const messageAPI = {
  list: (box) => api.get('/messages', { params: { box } }),
  unreadCount: () => api.get('/messages/unread-count'),
  recipients: () => api.get('/messages/recipients'),
  send: (data) => api.post('/messages', data),
  reply: (id, text) => api.post(`/messages/${id}/reply`, { text }),
  markRead: (id) => api.post(`/messages/${id}/read`),
  resolve: (id, note) => api.post(`/messages/${id}/resolve`, { note }),
};

export const campAPI = {
  list: (when) => api.get('/camps', { params: { when } }),
  create: (data) => api.post('/camps', data),
  update: (id, data) => api.patch(`/camps/${id}`, data),
};

export const incentiveAPI = {
  list: (params) => api.get('/incentives', { params }),
  activities: () => api.get('/incentives/activities'),
  suggestions: (month) => api.get('/incentives/suggestions', { params: { month } }),
  create: (data) => api.post('/incentives', data),
  act: (id, action, note) => api.patch(`/incentives/${id}`, { action, note }),
};

export const referralAPI = {
  list: (params) => api.get('/referrals', { params }),
  create: (data) => api.post('/referrals', data),
  update: (id, data) => api.patch(`/referrals/${id}`, data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getHeatmap: () => api.get('/admin/heatmap'),
  listUsers: (role, params) => api.get('/admin/users', { params: { role, ...params } }),
  toggleUser: (id) => api.put(`/admin/user/${id}/toggle`),
  createAsha: (data) => api.post('/admin/asha', data),
  resetPassword: (userId) => api.post(`/admin/user/${userId}/reset-password`),
  getMalnutrition: (status, params) => api.get('/admin/malnutrition', { params: { status, ...params } }),
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

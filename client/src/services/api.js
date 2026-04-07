import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from storage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/chatbot/');

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('sa_token');
    }
    return Promise.reject(error);
  }
);

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
  getPrediction: (childId) => api.get(`/growth/${childId}/predict`),
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
  childPDF: (childId) => api.get(`/reports/child/${childId}`, { responseType: 'blob' }),
  districtExcel: (districtId) => api.get(`/reports/district/${districtId}`, { responseType: 'blob' }),
};

export const dietAPI = {
  getByAgeGroup: (ageGroup) => api.get(`/diet/${ageGroup}`),
  getByAge: (months) => api.get(`/diet/age/${months}`),
};

export const chatbotAPI = {
  query: (message, history = [], language = 'English') => api.post('/chatbot/query', { message, history, language }),
};

export const hospitalAPI = {
  nearby: (lat, lng, radius = 30000, type = 'all') =>
    api.get('/hospitals/nearby', { params: { lat, lng, radius, type } }),
  search: (q, lat, lng) =>
    api.get('/hospitals/search', { params: { q, lat, lng } }),
  list: (params) => api.get('/hospitals', { params }),
};

export default api;

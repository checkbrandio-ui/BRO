// Кастомный адаптер — заменяет @base44/sdk
// API URL: https://api.bro-crm.ru

const API_URL = import.meta.env.VITE_API_URL || 'https://api.bro-crm.ru';
const TOKEN_KEY = 'base44_access_token';

// HTTP клиент
const api = {
 async request(method, path, body = null, publicRoute = false) {
   const headers = { 'Content-Type': 'application/json' };
   if (!publicRoute) {
     const token = localStorage.getItem(TOKEN_KEY);
     if (token) headers['Authorization'] = `Bearer ${token}`;
   }
   const res = await fetch(`${API_URL}${path}`, {
     method,
     headers,
     body: body ? JSON.stringify(body) : undefined,
   });
   const json = await res.json();
   if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
   return json.data;
 },
 get: (path, pub) => api.request('GET', path, null, pub),
 post: (path, body, pub) => api.request('POST', path, body, pub),
 put: (path, body) => api.request('PUT', path, body),
 delete: (path) => api.request('DELETE', path),
};

// ---- AUTH ----
const auth = {
 async login(email, password) {
   const data = await api.post('/api/auth/login', { email, password }, true);
   localStorage.setItem(TOKEN_KEY, data.token);
   return data.user;
 },
 async logout() {
   localStorage.removeItem(TOKEN_KEY);
 },
 async me() {
   return api.get('/api/auth/me');
 },
 async agencyLogin(access_code) {
   const data = await api.post('/api/auth/agency-login', { access_code }, true);
   sessionStorage.setItem('agency_session', JSON.stringify(data.agency));
   return data.agency;
 },
 async getFormByToken(token) {
   return api.get(`/api/auth/form/${token}`, true);
 },
};

// ---- ENTITY FACTORY ----
function makeEntity(path) {
 return {
   async list(sort = '-created_at', limit = 500) {
     const params = new URLSearchParams({ limit });
     if (sort) params.set('sort', sort);
     return api.get(`${path}?${params}`);
   },
   async filter(query = {}, sort, limit) {
     const params = new URLSearchParams(query);
     if (limit) params.set('limit', limit);
     if (sort) params.set('sort', sort);
     return api.get(`${path}?${params}`);
   },
   async get(id) {
     return api.get(`${path}/${id}`);
   },
   async create(data) {
     return api.post(path, data);
   },
   async update(id, data) {
     return api.put(`${path}/${id}`, data);
   },
   async delete(id) {
     return api.delete(`${path}/${id}`);
   },
 };
}

// ---- ENTITIES ----
const entities = {
 Candidate: makeEntity('/api/candidates'),
 Agency: makeEntity('/api/agencies'),
 City: makeEntity('/api/cities'),
 Notification: makeEntity('/api/notifications'),
 AssemblyPoint: makeEntity('/api/assembly-points'),
 CandidateForm: makeEntity('/api/candidate-forms'),
 CandidateLog: makeEntity('/api/candidate-logs'),
 AgentTicket: makeEntity('/api/agent-tickets'),
 User: makeEntity('/api/users'),
 CrmAdmin: makeEntity('/api/users'),
};

// ---- FUNCTIONS ----
const functions = {
 findNearestCity: (data) => api.post('/api/fn/find-nearest-city', data),
 getCrmAnalytics: (data) => api.post('/api/fn/crm-analytics', data),
};

// ---- ПУБЛИЧНЫЕ МАРШРУТЫ ----
const publicApi = {
 getFormByToken: (token) => api.get(`/api/candidate-forms/token/${token}`, true),
 submitForm: (token, data) => api.put(`/api/candidate-forms/token/${token}`, data),
};

// ---- ЭКСПОРТ совместимый с base44 SDK ----
const base44 = {
 auth,
 entities,
 functions,
 public: publicApi,
 asServiceRole: { entities },
};

export default base44;
export { auth, entities, functions, publicApi };
export const Candidate = entities.Candidate;
export const Agency = entities.Agency;
export const City = entities.City;
export const Notification = entities.Notification;
export const AssemblyPoint = entities.AssemblyPoint;
export const CandidateForm = entities.CandidateForm;
export const CandidateLog = entities.CandidateLog;
export const AgentTicket = entities.AgentTicket;
export const User = entities.User;
export const CrmAdmin = entities.CrmAdmin;
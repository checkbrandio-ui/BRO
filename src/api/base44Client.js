const API_URL = import.meta.env.VITE_API_URL || 'https://api.bro-crm.ru';
const TOKEN_KEY = 'base44_access_token';

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

const auth = {
 async login(email, password) {
   const data = await api.post('/api/auth/login', { email, password }, true);
   localStorage.setItem(TOKEN_KEY, data.token);
   return data.user;
 },
 async logout() { localStorage.removeItem(TOKEN_KEY); },
 async me() { return api.get('/api/auth/me'); },
 async agencyLogin(access_code) {
   const data = await api.post('/api/auth/agency-login', { access_code }, true);
   sessionStorage.setItem('agency_session', JSON.stringify(data.agency));
   return data.agency;
 },
};

function makeEntity(path) {
 return {
   async list(sort = '-created_at', limit = 500) {
     return api.get(`${path}?limit=${limit}`);
   },
   async filter(query = {}, sort, limit) {
     const params = new URLSearchParams();
     Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null) params.set(k, v); });
     if (limit) params.set('limit', limit);
     return api.get(`${path}?${params}`);
   },
   async get(id) { return api.get(`${path}/${id}`); },
   async create(data) { return api.post(path, data); },
   async update(id, data) { return api.put(`${path}/${id}`, data); },
   async delete(id) { return api.delete(`${path}/${id}`); },
 };
}

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

const functions = {
 findNearestCity: (data) => api.post('/api/fn/find-nearest-city', data),
 getCrmAnalytics: (data) => api.post('/api/fn/crm-analytics', data),
};

const base44 = { auth, entities, functions, asServiceRole: { entities } };

export default base44;
export { base44, auth, entities, functions };

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
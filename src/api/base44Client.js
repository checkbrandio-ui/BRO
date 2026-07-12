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
  get:    (path, pub)   => api.request('GET',    path, null, pub),
  post:   (path, body, pub) => api.request('POST',   path, body, pub),
  put:    (path, body)  => api.request('PUT',    path, body),
  delete: (path)        => api.request('DELETE', path),
  patch:  (path, body)  => api.request('PATCH',  path, body),
};

// ── AUTH ──────────────────────────────────────────────────────────────────────
const auth = {
  async login(email, password) {
    const data = await api.post('/api/auth/login', { email, password }, true);
    localStorage.setItem(TOKEN_KEY, data.token);
    return data.user;
  },
  // alias used by Login.jsx
  async loginViaEmailPassword(email, password) { return auth.login(email, password); },
  async register(data) { return api.post('/api/auth/register', data, true); },
  async logout(_redirectPath) { localStorage.removeItem(TOKEN_KEY); },
  async isAuthenticated() { return !!(localStorage.getItem(TOKEN_KEY)); },
  async me() { return api.get('/api/auth/me'); },
  async agencyLogin(access_code) {
    const data = await api.post('/api/auth/agency-login', { access_code }, true);
    sessionStorage.setItem('agency_session', JSON.stringify(data.agency));
    return data.agency;
  },
};

// ── ENTITIES ─────────────────────────────────────────────────────────────────
function makeEntity(path) {
  return {
    async list(_sort, limit = 500) {
      return api.get(`${path}?limit=${limit}`);
    },
    async filter(query = {}, _sort, limit) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, v);
      });
      if (limit) params.set('limit', limit);
      return api.get(`${path}?${params}`);
    },
    async get(id)         { return api.get(`${path}/${id}`); },
    async create(data)    { return api.post(path, data); },
    async update(id, data){ return api.request('PATCH', `${path}/${id}`, data); },
    async delete(id)      { return api.delete(`${path}/${id}`); },
    // bulk helpers
    async bulkUpdate(updates) {
      // updates = [{ id, ...fields }, ...]
      return Promise.all(updates.map(({ id, ...fields }) => api.request('PATCH', `${path}/${id}`, fields)));
    },
    async deleteMany(query = {}) {
      // get matching records then delete each
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => { if (v != null) params.set(k, v); });
      const records = await api.get(`${path}?${params}`);
      const list = Array.isArray(records) ? records : (records?.items || []);
      return Promise.all(list.map(r => api.delete(`${path}/${r.id}`)));
    },
    // stub: realtime replaced by polling (setInterval already in components)
    subscribe(_cb) { return () => {}; },
  };
}

const entities = {
  Candidate:     makeEntity('/api/candidates'),
  Agency:        makeEntity('/api/agencies'),
  City:          makeEntity('/api/cities'),
  Notification:  makeEntity('/api/notifications'),
  AssemblyPoint: makeEntity('/api/assembly-points'),
  CandidateForm: makeEntity('/api/candidate-forms'),
  CandidateLog:  makeEntity('/api/candidate-logs'),
  AgentTicket:   makeEntity('/api/agent-tickets'),
  User:          makeEntity('/api/users'),
  CrmAdmin:      makeEntity('/api/crm-admins'),
};

// ── FUNCTIONS ─────────────────────────────────────────────────────────────────
const functions = {
  // universal invoke — maps function name to /api/fn/<camelCase>
  async invoke(name, data) {
    const slug = name.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
    return api.post(`/api/fn/${slug}`, data || {});
  },
  findNearestCity: (data) => api.post('/api/fn/find-nearest-city', data),
  getCrmAnalytics: (data) => api.post('/api/fn/crm-analytics', data),
};

// ── INTEGRATIONS (stubs — replace with real impl as needed) ──────────────────
const integrations = {
  Core: {
    async SendEmail(data)       { return api.post('/api/integrations/send-email', data); },
    async UploadFile({ file })  {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: fd,
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      return json.data;
    },
    async TranscribeAudio(data) { return api.post('/api/integrations/transcribe', data); },
    async InvokeLLM(data)       { return api.post('/api/integrations/llm', data); },
  },
};

// ── AGENTS (stubs for AssistantWidget) ───────────────────────────────────────
const agents = {
  async listConversations()          { return []; },
  async createConversation(_data)    { return { id: null }; },
  async addMessage(_convId, _msg)    { return {}; },
  subscribeToConversation(_id, _cb)  { return () => {}; },
};

// ── USERS ────────────────────────────────────────────────────────────────────
const users = {
  async inviteUser(email, role) { return api.post('/api/users/invite', { email, role }); },
};

// ── MAIN EXPORT ──────────────────────────────────────────────────────────────
const base44 = {
  auth,
  entities,
  functions,
  integrations,
  agents,
  users,
  asServiceRole: { entities },
};

export default base44;
export { base44, auth, entities, functions, integrations };

export const Candidate     = entities.Candidate;
export const Agency        = entities.Agency;
export const City          = entities.City;
export const Notification  = entities.Notification;
export const AssemblyPoint = entities.AssemblyPoint;
export const CandidateForm = entities.CandidateForm;
export const CandidateLog  = entities.CandidateLog;
export const AgentTicket   = entities.AgentTicket;
export const User          = entities.User;
export const CrmAdmin      = entities.CrmAdmin;

// ── NAMED API CLIENT (для прямого использования в компонентах) ───────────────
// Используй вместо голых fetch + authH() + API
// import { apiClient } from '@/api/base44Client';
// await apiClient.get('/api/candidates?limit=100')
// await apiClient.patch('/api/candidates/123', { status: 'new' })
export const apiClient = {
  get:    (path) => api.get(path),
  post:   (path, body) => api.post(path, body),
  patch:  (path, body) => api.patch(path, body),
  delete: (path) => api.delete(path),
  postPublic: (path, body) => api.post(path, body, true),
  getPublic:  (path) => api.get(path, true),
};

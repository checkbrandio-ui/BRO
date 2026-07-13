import { useState, useEffect } from 'react';
import { apiClient } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Shield, User, RefreshCw, Search, Mail } from 'lucide-react';
import { motion } from 'framer-motion';



const ROLE_LABELS = { admin: 'Администратор', user: 'Менеджер' };
const ROLE_COLORS = {
  admin: 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/30',
  user:  'bg-[#7B3FBF]/15 text-[#7B3FBF] border-[#7B3FBF]/30',
};

export default function Users() {
  const [users, setUsers]       = useState([]);
  const [me, setMe]             = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState('user');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const [allUsers, currentUser] = await Promise.all([
      apiClient.get('/api/users?sort=-created_date&limit=200').then(j=>j.data||[]),
      base44.auth.me(),
    ]);
    setUsers(allUsers);
    setMe(currentUser);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true); setInviteMsg('');
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      setInviteMsg(`✓ Приглашение отправлено на ${inviteEmail}`);
      setInviteEmail('');
      load();
    } catch (err) {
      setInviteMsg('✗ ' + (err.message || 'Ошибка отправки'));
    }
    setInviting(false);
  };

  const handleRoleChange = async (user, newRole) => {
    if (user.id === me?.id) { alert('Нельзя изменить свою роль'); return; }
    setUpdatingId(user.id);
    await apiClient.patch(`/api/users/${user.id}`, { role: newRole });
    setUsers(u => u.map(x => x.id === user.id ? { ...x, role: newRole } : x));
    setUpdatingId(null);
  };

  const handleDelete = async (user) => {
    if (user.id === me?.id) { alert('Нельзя удалить себя'); return; }
    if (!confirm(`Удалить пользователя ${user.full_name || user.email}?`)) return;
    await apiClient.delete(`/api/users/${user.id}`);
    setUsers(u => u.filter(x => x.id !== user.id));
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const inp = "bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/25 focus:outline-none focus:border-[#7B3FBF] transition-all";

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F8FAFC]">
      {/* Header */}
      <div className="border-b border-[rgba(123,63,191,0.15)] bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-[#F8FAFC]/50 hover:text-[#F8FAFC] transition-colors">
            <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png" className="w-7 h-7 object-contain" alt="logo" />
          </Link>
          <span className="text-[rgba(123,63,191,0.4)]">/</span>
          <Link to="/admin/agencies" className="text-sm text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-colors">Агентства</Link>
          <span className="text-[rgba(123,63,191,0.4)]">/</span>
          <Link to="/admin/candidates" className="text-sm text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-colors">Кандидаты</Link>
          <span className="text-[rgba(123,63,191,0.4)]">/</span>
          <h1 className="text-sm font-bold text-[#F8FAFC]">Пользователи</h1>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Всего пользователей', value: users.length },
            { label: 'Администраторов', value: users.filter(u => u.role === 'admin').length },
            { label: 'Менеджеров', value: users.filter(u => u.role === 'user').length },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-xl p-4">
              <div className="text-2xl font-black text-[#7B3FBF]">{s.value}</div>
              <div className="text-xs text-[#F8FAFC]/45 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Invite form */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-sm font-bold text-[#F8FAFC] mb-4 flex items-center gap-2"><Plus size={15} className="text-[#7B3FBF]"/>Пригласить нового пользователя</h2>
          <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F8FAFC]/30" />
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="user@example.com" className={inp + ' w-full pl-9'} required />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Роль</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className={inp}>
                <option value="user">Менеджер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <button type="submit" disabled={inviting}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#7B3FBF] text-white text-sm font-bold rounded-lg hover:bg-[#8B4FCF] transition-all disabled:opacity-50">
              {inviting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Plus size={14}/>Пригласить</>}
            </button>
          </form>
          {inviteMsg && (
            <p className={`mt-3 text-sm ${inviteMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{inviteMsg}</p>
          )}
          <p className="mt-3 text-xs text-[#F8FAFC]/25">Пользователь получит письмо со ссылкой для установки пароля и входа в систему.</p>
        </div>

        {/* Users list */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[rgba(123,63,191,0.12)]">
            <h2 className="text-sm font-bold text-[#F8FAFC]">Список пользователей</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F8FAFC]/30" />
                <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
                  className={inp + ' pl-8 text-xs py-2'} />
              </div>
              <button onClick={load} className="p-2 rounded-lg hover:bg-[#7B3FBF]/15 text-[#F8FAFC]/40 hover:text-[#7B3FBF] transition-all" title="Обновить">
                <RefreshCw size={14}/>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-[#7B3FBF]/30 border-t-[#7B3FBF] rounded-full animate-spin"/></div>
          ) : (
            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
              {filtered.map(user => (
                <motion.div key={user.id} layout
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-[rgba(123,63,191,0.05)] transition-colors ${user.id === me?.id ? 'bg-[rgba(123,63,191,0.04)]' : ''}`}>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-[#7B3FBF]/20 flex items-center justify-center flex-shrink-0">
                    {user.role === 'admin' ? <Shield size={16} className="text-[#C9A84C]"/> : <User size={16} className="text-[#7B3FBF]"/>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#F8FAFC] truncate">{user.full_name || '—'}</span>
                      {user.id === me?.id && <span className="text-xs text-[#F8FAFC]/30 bg-white/5 px-2 py-0.5 rounded">(вы)</span>}
                    </div>
                    <div className="text-xs text-[#F8FAFC]/40 truncate">{user.email}</div>
                  </div>

                  {/* Role badge + toggle */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded border font-medium ${ROLE_COLORS[user.role] || 'bg-white/5 text-white/40 border-white/10'}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>

                    {user.id !== me?.id && (
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user, e.target.value)}
                        disabled={updatingId === user.id}
                        className="text-xs px-2 py-1.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg text-[#F8FAFC]/60 focus:outline-none focus:border-[#7B3FBF] transition-all disabled:opacity-50"
                      >
                        <option value="user">Менеджер</option>
                        <option value="admin">Администратор</option>
                      </select>
                    )}
                  </div>

                  {/* Delete */}
                  {user.id !== me?.id && (
                    <button onClick={() => handleDelete(user)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-[#F8FAFC]/30 hover:text-red-400 transition-all flex-shrink-0">
                      <Trash2 size={15}/>
                    </button>
                  )}
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-[#F8FAFC]/30 text-sm">Пользователи не найдены</div>
              )}
            </div>
          )}
        </div>

        {/* Note */}
        <div className="text-xs text-[#F8FAFC]/20 text-center leading-relaxed">
          Восстановление пароля: попросите пользователя нажать «Забыли пароль?» на странице входа, либо удалите и пригласите его заново.
        </div>
      </div>
    </div>
  );
}
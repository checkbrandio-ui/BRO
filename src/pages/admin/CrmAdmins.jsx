import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/api/base44Client';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, Trash2, Power, KeyRound, ShieldCheck, UserCog, Copy, Check, X, Loader2 } from 'lucide-react';
import { getCrmAdmin, generateAccessCode } from '@/lib/crmSession';
import { useToast } from '@/components/ui/use-toast';

// Централизованный fetch helper (использует тот же токен что apiClient)
const _token = () => localStorage.getItem('base44_access_token') || '';
const _h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${_token()}` });
const _api = import.meta.env.VITE_API_URL || 'https://api.bro-crm.ru';



export default function CrmAdmins() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ full_name: '', access_code: generateAccessCode(), role: 'manager' });
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const currentAdmin = getCrmAdmin();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const lr = await apiClient.get('/api/crm-admins?sort=-created_date&limit=100');
      const list = lr.data || [];
      setAdmins(list);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newAdmin.full_name.trim() || !newAdmin.access_code.trim()) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const exRes = await apiClient.get('/api/crm-admins?access_code=${encodeURIComponent(newAdmin.access_code.trim())}');
      const existing = exRes.data || [];
      if (existing.length > 0) {
        toast({ title: 'Код уже используется', description: 'Сгенерируйте новый код', variant: 'destructive' });
        setCreating(false);
        return;
      }
      await fetch(`${_api}/api/crm-admins`, { method: 'POST', headers: _h(), body: JSON.stringify({
        full_name: newAdmin.full_name.trim(),
        access_code: newAdmin.access_code.trim(),
        role: newAdmin.role,
        is_active: true,
      }) });
      toast({ title: '✓ Администратор создан', description: `Код: ${newAdmin.access_code}` });
      setShowCreate(false);
      setNewAdmin({ full_name: '', access_code: generateAccessCode(), role: 'manager' });
      load();
    } catch (e) {
      toast({ title: 'Ошибка создания', variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleToggleActive = async (admin) => {
    await apiClient.patch('/api/crm-admins/${admin.id}', { is_active: !admin.is_active });
    load();
  };

  const handleDelete = async (admin) => {
    if (admin.id === currentAdmin.id) {
      toast({ title: 'Нельзя удалить себя', variant: 'destructive' });
      return;
    }
    const otherSuperAdmins = admins.filter(a => a.role === 'super_admin' && a.is_active && a.id !== admin.id);
    if (admin.role === 'super_admin' && otherSuperAdmins.length === 0) {
      toast({ title: 'Нельзя удалить последнего супер-админа', variant: 'destructive' });
      return;
    }
    if (!confirm(`Удалить администратора «${admin.full_name}»?`)) return;
    await apiClient.delete('/api/crm-admins/${admin.id}');
    load();
  };

  const copyCode = (admin) => {
    navigator.clipboard.writeText(admin.access_code);
    setCopiedId(admin.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const inp = "px-3 py-2.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg text-sm text-[#F8FAFC] focus:outline-none focus:border-[#7B3FBF]";

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F8FAFC]">
      {/* Header */}
      <div className="border-b border-[rgba(123,63,191,0.15)] bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to="/" className="flex items-center gap-2 text-[#F8FAFC]/50 hover:text-[#F8FAFC] transition-colors">
              <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png" className="w-7 h-7 object-contain" alt="logo" />
            </Link>
            <span className="text-[rgba(123,63,191,0.4)]">/</span>
            <Link to="/admin/candidates" className="text-sm text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-colors">CRM</Link>
            <span className="text-[rgba(123,63,191,0.4)]">/</span>
            <h1 className="text-sm font-bold text-[#F8FAFC]">Администраторы CRM</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} title="Обновить"
              className="p-2 rounded-lg border border-[rgba(123,63,191,0.2)] text-[#F8FAFC]/50 hover:text-[#7B3FBF] hover:border-[#7B3FBF]/40 transition-all">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setShowCreate(v => !v)}
              className="flex items-center gap-2 px-4 py-2 text-xs rounded bg-[#C9A84C] text-[#05070A] hover:bg-[#D9B85C] transition-all font-bold">
              <Plus size={14} /> Новый администратор
            </button>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 py-6">
        {/* Create form */}
        {showCreate && (
          <div className="glass-card-gold rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#C9A84C] uppercase tracking-widest">Новый администратор</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#F8FAFC]/40 hover:text-[#F8FAFC]"><X size={18} /></button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">ФИО</label>
                <input className={inp + ' w-full'} value={newAdmin.full_name}
                  onChange={e => setNewAdmin(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Иванов Иван Иванович" />
              </div>
              <div>
                <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Код доступа</label>
                <div className="flex gap-2">
                  <input className={inp + ' flex-1 font-mono tracking-wider'} value={newAdmin.access_code}
                    onChange={e => setNewAdmin(p => ({ ...p, access_code: e.target.value }))} />
                  <button type="button" onClick={() => setNewAdmin(p => ({ ...p, access_code: generateAccessCode() }))}
                    className="px-3 rounded-lg border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all flex items-center gap-1 text-xs whitespace-nowrap"
                    title="Сгенерировать новый код">
                    <KeyRound size={12} /> Новый
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Роль</label>
                <select className={inp + ' w-full'} value={newAdmin.role}
                  onChange={e => setNewAdmin(p => ({ ...p, role: e.target.value }))}>
                  <option value="manager">Менеджер (без окончат. удаления)</option>
                  <option value="super_admin">Супер-админ (полный доступ)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleCreate} disabled={creating}
                className="flex items-center gap-2 px-6 py-2.5 text-sm rounded-lg bg-[#C9A84C] text-[#05070A] hover:bg-[#D9B85C] font-bold transition-all disabled:opacity-50">
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {creating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        )}

        {/* Info banner */}
        <div className="mb-4 px-4 py-3 rounded-xl bg-[#7B3FBF]/8 border border-[#7B3FBF]/20 text-xs text-[#F8FAFC]/60 flex items-start gap-2">
          <ShieldCheck size={14} className="text-[#7B3FBF] flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#F8FAFC]">Супер-администраторы</strong> имеют полный доступ, включая окончательное удаление записей.
            <strong className="text-[#F8FAFC]"> Менеджеры</strong> могут редактировать, архивировать и удалять в корзину, но не могут очищать корзину.
            Все действия логируются с возможностью отмены.
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" /></div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(123,63,191,0.15)]">
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider">ФИО</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider">Роль</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider">Код доступа</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider">Статус</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider">Последний вход</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(a => {
                    const isSelf = a.id === currentAdmin.id;
                    const isSuper = a.role === 'super_admin';
                    return (
                      <tr key={a.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(123,63,191,0.06)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#F8FAFC]">{a.full_name}</span>
                            {isSelf && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7B3FBF]/20 text-[#7B3FBF]">вы</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                            isSuper
                              ? 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/25'
                              : 'bg-[#7B3FBF]/10 text-[#7B3FBF] border-[#7B3FBF]/25'
                          }`}>
                            {isSuper ? <ShieldCheck size={11} /> : <UserCog size={11} />}
                            {isSuper ? 'Супер-админ' : 'Менеджер'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-[#F8FAFC]/60 font-mono tracking-wider">{a.access_code}</code>
                            <button onClick={() => copyCode(a)} title="Скопировать код"
                              className="text-[#F8FAFC]/30 hover:text-[#C9A84C] transition-colors">
                              {copiedId === a.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${a.is_active ? 'text-green-400' : 'text-red-400'}`}>
                            {a.is_active ? '✓ Активен' : '✗ Отключён'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#F8FAFC]/40 whitespace-nowrap">
                          {a.last_login ? new Date(a.last_login).toLocaleString('ru-RU') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleToggleActive(a)} title={a.is_active ? 'Деактивировать' : 'Активировать'}
                              className={`p-1.5 rounded transition-all ${a.is_active ? 'text-[#F8FAFC]/50 hover:bg-green-500/20 hover:text-green-400' : 'text-[#F8FAFC]/50 hover:bg-green-500/20 hover:text-green-400'}`}>
                              <Power size={14} />
                            </button>
                            <button onClick={() => handleDelete(a)} title="Удалить"
                              className="p-1.5 rounded hover:bg-red-500/20 text-[#F8FAFC]/50 hover:text-red-400 transition-all">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {admins.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-[#F8FAFC]/30">Администраторы не найдены</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
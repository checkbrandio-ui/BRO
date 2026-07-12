import { useState, useEffect } from 'react';
import { apiClient } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Download, Mail, Phone, Edit2, Trash2, Search, RefreshCw, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import AgencyModal from '../../components/admin/AgencyModal';

export default function Agencies() {
  const { toast } = useToast();
  const [agencies, setAgencies]       = useState([]);
  const [candidates, setCandidates]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterCity, setFilterCity]   = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editAgency, setEditAgency]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ag, cand] = await Promise.all([
        apiClient.get('/api/agencies?limit=500'),
        apiClient.get('/api/candidates?limit=1000'),
      ]);
      setAgencies(Array.isArray(ag) ? ag : []);
      setCandidates(Array.isArray(cand) ? cand : []);
    } catch (e) {
      toast({ title: 'Ошибка загрузки', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getCandidatesForAgency = (agencyId) =>
    candidates.filter(c => c.agency_id === agencyId && !c.deleted_at);

  const handleDelete = async (agency) => {
    if (!confirm(`Удалить агентство "${agency.name}"?\nКандидаты будут скрыты из статистики. Восстановление возможно в течение 3 дней.`)) return;
    try {
      await apiClient.patch(`/api/agencies/${agency.id}`, { deleted_at: new Date().toISOString() });
      load();
    } catch (e) {
      toast({ title: 'Ошибка удаления', description: e.message, variant: 'destructive' });
    }
  };

  const handleRestore = async (agency) => {
    try {
      await apiClient.patch(`/api/agencies/${agency.id}`, { deleted_at: null });
      load();
    } catch (e) {
      toast({ title: 'Ошибка восстановления', description: e.message, variant: 'destructive' });
    }
  };

  const handleSave = async (data, id) => {
    try {
      if (id) {
        await apiClient.patch(`/api/agencies/${id}`, data);
      } else {
        if (!data.name?.trim()) {
          toast({ title: 'Укажите наименование агентства', variant: 'destructive' });
          return;
        }
        await apiClient.post('/api/agencies', data);
      }
      setModalOpen(false);
      setEditAgency(null);
      load();
    } catch (e) {
      toast({ title: 'Ошибка сохранения', description: e.message, variant: 'destructive' });
    }
  };

  const exportCSV = () => {
    const headers = ['Агентство', 'Город', 'Email', 'Телефон', 'Кандидатов', 'Дата договора', 'Активно'];
    const rows = activeAgencies.map(a => [
      a.name, a.city, a.email, a.phone,
      getCandidatesForAgency(a.id).length, a.contract_date, a.is_active ? 'Да' : 'Нет',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'agencies.csv'; a.click();
  };

  const now = Date.now();
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const activeAgencies  = agencies.filter(a => !a.deleted_at);
  const deletedAgencies = agencies.filter(a => {
    if (!a.deleted_at) return false;
    return now - new Date(a.deleted_at).getTime() < THREE_DAYS;
  });

  const activeAgencyIds = new Set(activeAgencies.map(a => a.id));
  const activeCandidates = candidates.filter(c => activeAgencyIds.has(c.agency_id) && !c.deleted_at);
  const cities = [...new Set(activeAgencies.map(a => a.city).filter(Boolean))].sort();

  const filtered = (showDeleted ? deletedAgencies : activeAgencies).filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name?.toLowerCase().includes(q) || a.city?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
    const matchCity = !filterCity || a.city === filterCity;
    return matchSearch && matchCity;
  });

  const inp = "px-3 py-2.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg text-sm text-[#F8FAFC] focus:outline-none focus:border-[#7B3FBF]";

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F8FAFC]">
      <div className="border-b border-[rgba(123,63,191,0.15)] bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="w-full mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-[#F8FAFC]/50 hover:text-[#F8FAFC] transition-colors">
              <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png" className="w-7 h-7 object-contain" alt="logo" />
            </Link>
            <span className="text-[rgba(123,63,191,0.4)]">/</span>
            <h1 className="text-sm font-bold text-[#F8FAFC]">База агентств</h1>
            <Link to="/admin/candidates" className="text-sm text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-colors">База кандидатов</Link>
            <Link to="/admin/users" className="text-sm text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-colors">Пользователи</Link>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} title="Обновить данные"
              className="p-2 rounded-lg border border-[rgba(123,63,191,0.2)] text-[#F8FAFC]/50 hover:text-[#7B3FBF] hover:border-[#7B3FBF]/40 transition-all">
              <RefreshCw size={14} />
            </button>
            {deletedAgencies.length > 0 && (
              <button onClick={() => setShowDeleted(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 text-xs rounded border transition-all ${showDeleted ? 'border-[#C9A84C]/50 text-[#C9A84C] bg-[#C9A84C]/10' : 'border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/40 hover:text-[#C9A84C]'}`}>
                <RotateCcw size={13} /> Удалённые ({deletedAgencies.length})
              </button>
            )}
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 text-xs rounded border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all">
              <Download size={14} /> Экспорт CSV
            </button>
            <button onClick={() => { setEditAgency(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 text-xs rounded bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] transition-all">
              <Plus size={14} /> Добавить агентство
            </button>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F8FAFC]/30" />
            <input type="text" placeholder="Поиск по названию, городу, email..."
              value={search} onChange={e => setSearch(e.target.value)}
              className={inp + ' w-full pl-9'} />
          </div>
          {!showDeleted && (
            <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className={inp}>
              <option value="">Все города</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {filterCity && (
            <button onClick={() => setFilterCity('')}
              className="px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
              ✕ Сбросить
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Всего агентств',    value: activeAgencies.length },
            { label: 'Активных',          value: activeAgencies.filter(a => a.is_active !== false).length },
            { label: 'Всего кандидатов',  value: activeCandidates.length },
            { label: 'Готовы к отправке', value: activeCandidates.filter(c => c.payment_basis === 'Готовится к отправке').length },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-xl p-4">
              <div className="text-2xl font-black text-[#7B3FBF]">{s.value}</div>
              <div className="text-xs text-[#F8FAFC]/45 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {showDeleted && deletedAgencies.length > 0 && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/20 text-xs text-[#C9A84C]/80">
            Удалённые агентства восстановимы в течение 3 дней с момента удаления. Кандидаты сохранены.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#7B3FBF]/30 border-t-[#7B3FBF] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#F8FAFC]/30 text-sm">
            {showDeleted ? 'Нет недавно удалённых агентств' : 'Агентства не найдены'}
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(123,63,191,0.15)]">
                    {['Агентство', 'Город', 'Контакты', 'Кандидатов', 'Дата договора', 'Статус', 'Действия'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((agency) => {
                    const cands = getCandidatesForAgency(agency.id);
                    const isDeleted = !!agency.deleted_at;
                    const daysLeft = isDeleted
                      ? Math.ceil((THREE_DAYS - (now - new Date(agency.deleted_at).getTime())) / 86400000)
                      : null;
                    return (
                      <tr key={agency.id}
                        className={`border-b border-[rgba(123,63,191,0.08)] transition-colors ${isDeleted ? 'opacity-50' : 'hover:bg-[rgba(123,63,191,0.04)]'}`}>
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#F8FAFC]">{agency.name}</div>
                          {agency.access_code && (
                            <div className="text-xs text-[#F8FAFC]/30 font-mono mt-0.5">{agency.access_code}</div>
                          )}
                          {isDeleted && daysLeft != null && (
                            <div className="text-xs text-[#C9A84C] mt-0.5">Удалено · осталось {daysLeft} д.</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#F8FAFC]/60">{agency.city || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {agency.email && (
                              <a href={`mailto:${agency.email}`} className="flex items-center gap-1 text-xs text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-colors">
                                <Mail size={11} />{agency.email}
                              </a>
                            )}
                            {agency.phone && (
                              <a href={`tel:${agency.phone}`} className="flex items-center gap-1 text-xs text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-colors">
                                <Phone size={11} />{agency.phone}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-lg font-black text-[#7B3FBF]">{cands.length}</span>
                          {agency.planned_candidates > 0 && (
                            <span className="text-xs text-[#F8FAFC]/30 ml-1">/ {agency.planned_candidates}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#F8FAFC]/50 text-xs">{agency.contract_date || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${agency.is_active !== false ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                            {agency.is_active !== false ? 'Активно' : 'Отключено'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {isDeleted ? (
                              <button onClick={() => handleRestore(agency)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-[#C9A84C]/15 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-all">
                                <RotateCcw size={12} /> Восстановить
                              </button>
                            ) : (
                              <>
                                <button onClick={() => { setEditAgency(agency); setModalOpen(true); }}
                                  className="p-1.5 rounded-lg hover:bg-[rgba(123,63,191,0.15)] text-[#F8FAFC]/40 hover:text-[#7B3FBF] transition-all">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(agency)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#F8FAFC]/40 hover:text-red-400 transition-all">
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <AgencyModal
          agency={editAgency}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditAgency(null); }}
        />
      )}
    </div>
  );
}

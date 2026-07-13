import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/api/base44Client';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, MapPin, ArrowLeft, Check, Plus, Pencil, Trash2 } from 'lucide-react';
import AddCityModal from '@/components/admin/AddCityModal';
import CityEditModal from '@/components/admin/CityEditModal';



export default function AssemblyPoints() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [addCityOpen, setAddCityOpen] = useState(false);
  const [editCity, setEditCity] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const cr = await apiClient.get('/api/cities?sort=-created_date&limit=500');
    const data = cr.data || [];
    setCities(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (city) => {
    setTogglingId(city.id);
    try {
      await apiClient.patch(`/api/cities/${city.id}`, { is_assembly_point: !city.is_assembly_point });
      setCities(prev => prev.map(c => c.id === city.id ? { ...c, is_assembly_point: !c.is_assembly_point } : c));
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
    setTogglingId(null);
  };

  const q = search.toLowerCase();
  const filtered = cities
    .filter(c => !q || c.name?.toLowerCase().includes(q) || c.region?.toLowerCase().includes(q))
    .sort((a, b) => {
      if (a.is_assembly_point && !b.is_assembly_point) return -1;
      if (!a.is_assembly_point && b.is_assembly_point) return 1;
      return a.name.localeCompare(b.name, 'ru');
    });
  const enabledCount = cities.filter(c => c.is_assembly_point).length;
  const totalAgentFee = cities.filter(c => c.is_assembly_point && c.agent_fee).reduce((sum, c) => sum + c.agent_fee, 0);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      // Проверяем, есть ли кандидаты, привязанные к этому городу
      const linkRes = await apiClient.get(`/api/candidates?city=${encodeURIComponent(confirmDelete.name)}&limit=10`);
      const linked = linkRes.data || [];
      if (linked.length > 0) {
        alert(`Невозможно удалить: к городу «${confirmDelete.name}» привязано ${linked.length} кандидатов. Сначала переназначьте их на другой город.`);
        return;
      }
      await apiClient.delete(`/api/cities/${confirmDelete.id}`);
      setConfirmDelete(null);
      load();
    } catch (e) {
      alert('Ошибка удаления: ' + e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F8FAFC]">
      {/* Header */}
      <div className="border-b border-[rgba(123,63,191,0.15)] bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[900px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/candidates" className="flex items-center gap-2 text-[#F8FAFC]/50 hover:text-[#F8FAFC] transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <span className="text-[rgba(123,63,191,0.4)]">/</span>
            <h1 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <MapPin size={14} className="text-[#C9A84C]" /> Точки сбора
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#C9A84C] font-bold">{enabledCount} активно</span>
            {totalAgentFee > 0 && (
              <span className="hidden sm:inline text-xs text-[#7B3FBF] font-bold">{totalAgentFee.toLocaleString('ru-RU')} ₽ агенту</span>
            )}
            <button onClick={() => setAddCityOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs rounded bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] transition-all">
              <Plus size={14} /> Добавить город
            </button>
            <button onClick={load} title="Обновить"
              className="p-2 rounded-lg border border-[rgba(123,63,191,0.2)] text-[#F8FAFC]/50 hover:text-[#7B3FBF] hover:border-[#7B3FBF]/40 transition-all">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-6">
        <div className="mb-4 px-4 py-3 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/20 text-xs text-[#F8FAFC]/60">
          Отметьте города, которые будут доступны для выбора в поле «Пункт сбора» карточки кандидата.
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F8FAFC]/30" />
          <input type="text" placeholder="Поиск по названию или региону..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/25 focus:outline-none focus:border-[#7B3FBF] transition-all" />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#7B3FBF]/30 border-t-[#7B3FBF] rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(c => {
              const fee = c.agent_fee != null;
              let feeColor = 'text-[#F8FAFC]/40';
              if (fee) {
                if (c.agent_fee >= 500000) feeColor = 'text-[#C9A84C]';
                else if (c.agent_fee >= 450000) feeColor = 'text-[#7B3FBF]';
                else if (c.agent_fee >= 400000) feeColor = 'text-[#3B82F6]';
                else if (c.agent_fee >= 300000) feeColor = 'text-[#60A5FA]';
                else feeColor = 'text-[#6B7280]';
              }
              return (
                <div key={c.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${c.is_assembly_point ? 'border-[#C9A84C]/30 bg-[#C9A84C]/8' : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(123,63,191,0.25)] hover:bg-[rgba(123,63,191,0.04)]'}`}>
                  <button onClick={() => togglingId === c.id ? null : toggle(c)}
                    disabled={togglingId === c.id}
                    className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${c.is_assembly_point ? 'border-[#C9A84C] bg-[#C9A84C]' : 'border-[#F8FAFC]/20'}`}>
                      {c.is_assembly_point && <Check size={12} className="text-[#05070A]" strokeWidth={3} />}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${c.is_assembly_point ? 'text-[#C9A84C]' : 'text-[#F8FAFC]/70'}`}>{c.name}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.region && <span className="text-xs text-[#F8FAFC]/30">{c.region}</span>}
                      {c.is_assembly_point && c.payment_amount != null && (
                        <span className="text-xs text-[#F8FAFC]/40">· выплата {c.payment_amount.toLocaleString('ru-RU')}₽</span>
                      )}
                      {c.is_assembly_point && c.processing_time && (
                        <span className="text-xs text-[#F8FAFC]/40">· {c.processing_time}</span>
                      )}
                      {fee && (
                        <span className={`text-xs font-bold ${feeColor}`}>· агенту {c.agent_fee.toLocaleString('ru-RU')}₽</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {c.lat != null && c.lon != null && (
                      <span className="hidden sm:inline text-xs text-[#F8FAFC]/20">коорд. ✓</span>
                    )}
                    <button onClick={() => setEditCity(c)} title="Редактировать"
                      className="p-1.5 rounded hover:bg-[#7B3FBF]/20 text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-all">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDelete(c)} title="Удалить"
                      className="p-1.5 rounded hover:bg-red-500/20 text-[#F8FAFC]/50 hover:text-red-400 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[#F8FAFC]/30">Города не найдены</div>
            )}
          </div>
        )}
      </div>
      {addCityOpen && (
        <AddCityModal
          onClose={() => setAddCityOpen(false)}
          onCityAdded={() => { setAddCityOpen(false); load(); }}
        />
      )}

      {editCity && (
        <CityEditModal
          city={editCity}
          onClose={() => setEditCity(null)}
          onSaved={() => { setEditCity(null); load(); }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-[#0D1B3E] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F8FAFC]">Удалить город?</h3>
                <p className="text-xs text-[#F8FAFC]/50 mt-1">«{confirmDelete.name}». Система проверит наличие привязанных кандидатов перед удалением.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-xs rounded-lg border border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/60 hover:text-[#F8FAFC] transition-all">Отмена</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 font-bold transition-all disabled:opacity-40">
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
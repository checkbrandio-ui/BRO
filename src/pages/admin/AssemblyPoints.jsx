import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, MapPin, ArrowLeft, Check, Plus } from 'lucide-react';
import AddCityModal from '@/components/admin/AddCityModal';

export default function AssemblyPoints() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [addCityOpen, setAddCityOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.City.list('-created_date', 500);
    setCities(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (city) => {
    setTogglingId(city.id);
    try {
      await base44.entities.City.update(city.id, { is_assembly_point: !city.is_assembly_point });
      setCities(prev => prev.map(c => c.id === city.id ? { ...c, is_assembly_point: !c.is_assembly_point } : c));
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
    setTogglingId(null);
  };

  const q = search.toLowerCase();
  const filtered = cities.filter(c => !q || c.name?.toLowerCase().includes(q) || c.region?.toLowerCase().includes(q));
  const enabledCount = cities.filter(c => c.is_assembly_point).length;

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
            {filtered.map(c => (
              <button key={c.id} onClick={() => togglingId === c.id ? null : toggle(c)}
                disabled={togglingId === c.id}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${c.is_assembly_point ? 'border-[#C9A84C]/30 bg-[#C9A84C]/8' : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(123,63,191,0.25)] hover:bg-[rgba(123,63,191,0.04)]'}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${c.is_assembly_point ? 'border-[#C9A84C] bg-[#C9A84C]' : 'border-[#F8FAFC]/20'}`}>
                  {c.is_assembly_point && <Check size={12} className="text-[#05070A]" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${c.is_assembly_point ? 'text-[#C9A84C]' : 'text-[#F8FAFC]/70'}`}>{c.name}</div>
                  {c.region && <div className="text-xs text-[#F8FAFC]/30">{c.region}</div>}
                </div>
                {c.lat != null && c.lon != null && (
                  <span className="text-xs text-[#F8FAFC]/20 flex-shrink-0">координаты ✓</span>
                )}
              </button>
            ))}
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
    </div>
  );
}
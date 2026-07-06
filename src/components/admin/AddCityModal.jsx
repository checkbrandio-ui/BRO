import { useState, useEffect } from 'react';
import { X, MapPin, Loader2, AlertTriangle, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function normalizeCityName(name) {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/^г[.\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function AddCityModal({ initialName, onClose, onCityAdded }) {
  const [name, setName] = useState(initialName || '');
  const [region, setRegion] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [allCities, setAllCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [duplicate, setDuplicate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.City.list('-created_date', 500)
      .then(setAllCities)
      .catch(() => {});
  }, []);

  // Fuzzy duplicate check — runs when name or allCities change
  useEffect(() => {
    if (allCities.length === 0 || !name.trim()) { setDuplicate(null); return; }
    const normalized = normalizeCityName(name);
    const found = allCities.find(c => normalizeCityName(c.name) === normalized);
    setDuplicate(found || null);
  }, [allCities, name]);

  // Auto-pick coordinates on mount if initialName provided
  useEffect(() => {
    if (!initialName || initialName.trim().length < 2) return;
    let cancelled = false;
    const autoPick = async () => {
      setGeoLoading(true);
      try {
        const resp = await base44.functions.invoke('getCityCoordinates', { city: initialName.trim() });
        const data = resp.data;
        if (cancelled) return;
        if (data?.lat != null && data?.lon != null) {
          setLat(String(data.lat));
          setLon(String(data.lon));
          if (data.region) setRegion(data.region);
        }
      } catch (e) {}
      if (!cancelled) setGeoLoading(false);
    };
    autoPick();
    return () => { cancelled = true; };
  }, []);

  const autoPickCoords = async () => {
    if (!name.trim()) { setError('Введите название города'); return; }
    setGeoLoading(true);
    setError('');
    try {
      const resp = await base44.functions.invoke('getCityCoordinates', { city: name.trim() });
      const data = resp.data;
      if (data?.lat != null && data?.lon != null) {
        setLat(String(data.lat));
        setLon(String(data.lon));
        if (data.region && !region) setRegion(data.region);
      } else {
        setError('Не удалось определить координаты автоматически. Введите широту и долготу вручную.');
      }
    } catch (e) {
      setError('Ошибка авто-подбора. Введите координаты вручную.');
    }
    setGeoLoading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Введите название города'); return; }
    if (duplicate) { setError(`Город «${duplicate.name}» уже есть в базе`); return; }
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (isNaN(latNum) || isNaN(lonNum)) { setError('Укажите корректные координаты (или нажмите «Авто-подбор»)'); return; }

    setLoading(true);
    try {
      const city = await base44.entities.City.create({
        name: name.trim(),
        region: region.trim(),
        lat: latNum,
        lon: lonNum,
        source: 'manual',
        is_assembly_point: false,
      });

      // Notify admins — тихая ошибка, город уже сохранён
      try {
        await base44.entities.Notification.create({
          message: `Добавлен новый город: ${name.trim()}${region.trim() ? ` (${region.trim()})` : ''}`,
          category: 'city',
          link: '/admin/assembly-points',
          is_read: false,
        });
      } catch (_) {}

      if (onCityAdded) onCityAdded(city);
      onClose();
    } catch (e) {
      setError('Ошибка сохранения: ' + (e.message || 'неизвестная'));
    }
    setLoading(false);
  };

  const inp = "w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/25 focus:outline-none focus:border-[#7B3FBF] transition-all";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D1B3E] border border-[rgba(123,63,191,0.25)] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(123,63,191,0.15)] sticky top-0 bg-[#0D1B3E] z-10">
          <h2 className="text-base font-black text-[#F8FAFC] flex items-center gap-2">
            <MapPin size={16} className="text-[#7B3FBF]" /> Добавить населённый пункт
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all text-[#F8FAFC]/60">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Название <span className="text-red-400">*</span></label>
            <input className={inp} value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder="г. Хабаровск" autoFocus />
          </div>

          {duplicate && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-400">Город уже в базе</div>
                <div className="text-xs text-amber-300/80 mt-0.5">«{duplicate.name}»{duplicate.region ? ` (${duplicate.region})` : ''} уже существует. Сохранение заблокировано.</div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Регион / субъект</label>
            <input className={inp} value={region} onChange={e => setRegion(e.target.value)} placeholder="Приморский край" />
          </div>

          <div className="border-t border-[rgba(123,63,191,0.15)] pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#F8FAFC]/40">Координаты <span className="text-red-400">*</span></label>
              <button onClick={autoPickCoords} disabled={geoLoading || !name.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[rgba(123,63,191,0.3)] text-[#7B3FBF] hover:bg-[rgba(123,63,191,0.1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {geoLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                {geoLoading ? 'Поиск...' : 'Авто-подбор'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#F8FAFC]/30 mb-1">Широта</label>
                <input className={inp} type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} placeholder="43.1333" />
              </div>
              <div>
                <label className="block text-xs text-[#F8FAFC]/30 mb-1">Долгота</label>
                <input className={inp} type="number" step="any" value={lon} onChange={e => setLon(e.target.value)} placeholder="131.9000" />
              </div>
            </div>
            <p className="text-xs text-[#F8FAFC]/30 mt-2">Нажмите «Авто-подбор» или введите координаты вручную. Без координат расчёт расстояния до пункта сбора работать не будет.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-5 py-2.5 text-sm rounded-lg border border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/60 hover:text-[#F8FAFC] transition-all">Отмена</button>
            <button onClick={handleSave} disabled={!!duplicate || loading || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {loading ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { X, Loader2, Banknote, Clock, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CityEditModal({ city, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: city?.name ?? '',
    region: city?.region ?? '',
    lat: city?.lat ?? '',
    lon: city?.lon ?? '',
    payment_amount: city?.payment_amount ?? '',
    previous_payment: city?.previous_payment ?? '',
    processing_time: city?.processing_time ?? '',
    agent_fee: city?.agent_fee ?? '',
    is_assembly_point: city?.is_assembly_point ?? false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Если выплата изменилась, сохраняем предыдущее значение
      const updates = { ...form };
      if (
        city?.payment_amount != null &&
        form.payment_amount != null &&
        Number(form.payment_amount) !== Number(city.payment_amount) &&
        !form.previous_payment
      ) {
        updates.previous_payment = Number(city.payment_amount);
      }
      // Нормализуем числовые поля
      ['lat', 'lon', 'payment_amount', 'previous_payment', 'agent_fee'].forEach(k => {
        if (updates[k] === '' || updates[k] == null) {
          delete updates[k];
        } else {
          updates[k] = Number(updates[k]);
        }
      });
      await base44.entities.City.update(city.id, updates);
      onSaved();
    } catch (e) {
      alert('Ошибка сохранения: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/25 focus:outline-none focus:border-[#7B3FBF] transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D1B3E] border border-[rgba(123,63,191,0.25)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(123,63,191,0.15)] sticky top-0 bg-[#0D1B3E] z-10">
          <h2 className="text-base font-black text-[#F8FAFC] flex items-center gap-2">
            {city?.name || 'Город'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all text-[#F8FAFC]/60"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Финансовые поля */}
          <div className="text-xs text-[#C9A84C] font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Banknote size={13} /> Финансы и оформление
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Выплата кандидату (₽)</label>
              <input type="number" className={inp} value={form.payment_amount}
                onChange={e => set('payment_amount', e.target.value)} placeholder="100000" />
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">
                <span className="flex items-center gap-1"><TrendingDown size={11} /> Пред. выплата (₽)</span>
              </label>
              <input type="number" className={inp} value={form.previous_payment}
                onChange={e => set('previous_payment', e.target.value)} placeholder="Необязательно" />
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">
                <span className="flex items-center gap-1"><Banknote size={11} className="text-[#7B3FBF]" /> Оплата агенту (₽)</span>
              </label>
              <input type="number" className={inp} value={form.agent_fee}
                onChange={e => set('agent_fee', e.target.value)} placeholder="50000" />
              <p className="text-[10px] text-[#F8FAFC]/30 mt-1">Определяет цвет маркера на карте</p>
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">
                <span className="flex items-center gap-1"><Clock size={11} /> Время оформления</span>
              </label>
              <input className={inp} value={form.processing_time}
                onChange={e => set('processing_time', e.target.value)} placeholder="1 день / 1–2 дня" />
            </div>
          </div>

          {/* Координаты (read-only подсказка) */}
          <div className="border-t border-[rgba(123,63,191,0.15)] pt-4">
            <div className="text-xs text-[#F8FAFC]/40 mb-2">Координаты</div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#F8FAFC]/30 mb-1.5">Широта</label>
                <input type="number" step="any" className={inp} value={form.lat}
                  onChange={e => set('lat', e.target.value)} placeholder="50.5556" />
              </div>
              <div>
                <label className="block text-xs text-[#F8FAFC]/30 mb-1.5">Долгота</label>
                <input type="number" step="any" className={inp} value={form.lon}
                  onChange={e => set('lon', e.target.value)} placeholder="137.0" />
              </div>
            </div>
          </div>

          {/* Чекбокс точки сбора */}
          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <input type="checkbox" checked={form.is_assembly_point}
              onChange={e => set('is_assembly_point', e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(123,63,191,0.3)] bg-transparent accent-[#7B3FBF]" />
            <span className="text-sm text-[#F8FAFC]/70">Является точкой сбора</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-2.5 text-sm rounded-lg border border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/60 hover:text-[#F8FAFC] transition-all">Отмена</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] font-bold transition-all disabled:opacity-40">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Phone } from 'lucide-react';

const POSITIONS = ['Разнорабочий','Строитель','Водитель B','Водитель C','Водитель CE','Водитель D','Автослесарь','Медицинский работник','Охранник'];

export default function ContactsSection({ form, set, isAgencyMode, agencies, onAgencyChange, onOpenCallDrawer, inp }) {
  return (
    <div className="rounded-xl border border-[rgba(123,63,191,0.15)] bg-[rgba(123,63,191,0.04)] p-4 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#7B3FBF]">
        <Phone size={12} /> Контакты и должность
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Телефон</label>
          <div className="flex gap-2">
            <input className={inp + ' flex-1'} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 (___) ___-__-__" />
            {form.phone && (
              <button type="button" onClick={onOpenCallDrawer}
                title={`Позвонить: ${form.phone}`}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 hover:border-green-500/50 transition-all flex-shrink-0">
                <Phone size={15} />
                <span className="text-xs font-bold whitespace-nowrap hidden sm:inline">Позвонить</span>
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Email</label>
          <input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="example@mail.ru" />
        </div>
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Должность</label>
          <select className={inp} value={form.position} onChange={e => set('position', e.target.value)}>
            <option value="">Выберите...</option>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {!isAgencyMode && (
          <div>
            <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Кадровое агентство</label>
            <select className={inp} value={form.agency_id} onChange={e => onAgencyChange(e.target.value)}>
              <option value="">Выберите...</option>
              {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Состояние здоровья</label>
          <select className={inp} value={form.health_status} onChange={e => set('health_status', e.target.value)}>
            <option value="">Не указано</option>
            <option value="Без замечаний">Без замечаний</option>
            <option value="Ограничения/жалобы">Ограничения/жалобы</option>
          </select>
        </div>
        {form.health_status === 'Ограничения/жалобы' && (
          <div>
            <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Описание ограничений</label>
            <input className={inp} value={form.health_details} onChange={e => set('health_details', e.target.value)} placeholder="Укажите ограничения..." />
          </div>
        )}
      </div>
    </div>
  );
}
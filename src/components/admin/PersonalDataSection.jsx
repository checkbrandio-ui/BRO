import { User } from 'lucide-react';
import CitySelect from '@/components/CitySelect';
import { CITIZENSHIPS } from '@/lib/candidateConstants';
import DatePicker from '@/components/ui/DatePicker';

export default function PersonalDataSection({ form, set, errors, setErrors, nameInputRef, checking, onNameChange, onBirthDateChange, onCitySelect, inp }) {
  return (
    <div className="rounded-xl border border-[rgba(123,63,191,0.15)] bg-[rgba(123,63,191,0.04)] p-4 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#7B3FBF]">
        <User size={12} /> Личные данные
      </div>
      <div>
        <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">ФИО <span className="text-red-400">*</span></label>
        <input ref={nameInputRef} className={inp + (errors.full_name ? ' !border-red-500' : '')} value={form.full_name} onChange={e => { onNameChange(e.target.value); if (errors.full_name) setErrors(p => ({ ...p, full_name: false })); }} placeholder="Иванов Иван Иванович" />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Дата рождения <span className="text-red-400">*</span></label>
          <DatePicker value={form.birth_date} onChange={v => { onBirthDateChange(v); if (errors.birth_date) setErrors(p => ({ ...p, birth_date: false })); }} className={errors.birth_date ? '!border-red-500' : ''} placeholder="Выберите дату" />
          {checking && <p className="text-xs text-[#F8FAFC]/30 mt-1">Проверка стоп-листа...</p>}
        </div>
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Гражданство</label>
          <select className={inp} value={form.citizenship} onChange={e => set('citizenship', e.target.value)}>
            <option value="">Выберите...</option>
            {CITIZENSHIPS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Место рождения</label>
          <input className={inp} value={form.birth_place} onChange={e => set('birth_place', e.target.value)} placeholder="г. Москва" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Город проживания</label>
        <CitySelect
          value={form.city}
          onChange={val => set('city', val)}
          onCitySelect={onCitySelect}
          inputClassName={inp}
          placeholder="г. Хабаровск"
        />
      </div>
    </div>
  );
}
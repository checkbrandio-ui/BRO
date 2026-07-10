import { SB_OPTIONS, MED_OPTIONS } from '@/lib/candidateConstants';
import StatusDropdown from '@/components/ui/StatusDropdown';

export default function AdminStatusesSection({ form, set, paymentAmount, inp }) {
  return (
    <div className="border-t border-[rgba(123,63,191,0.15)] pt-4">
      <div className="text-xs text-[#7B3FBF] font-bold uppercase tracking-widest mb-3">Статусы (только администратор)</div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Проверка СБ</label>
          <StatusDropdown
            value={form.sb_check}
            onChange={v => set('sb_check', v)}
            options={SB_OPTIONS}
            placeholder="Не указано"
            allowEmpty
            emptyLabel="Не указано"
          />
        </div>
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Медкомиссия</label>
          <StatusDropdown
            value={form.medical_check}
            onChange={v => set('medical_check', v)}
            options={MED_OPTIONS}
            placeholder="Не указано"
            allowEmpty
            emptyLabel="Не указано"
          />
        </div>
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Основание для выплаты</label>
          <select className={inp} value={form.payment_basis} onChange={e => set('payment_basis', e.target.value)}>
            <option value="">Не указано</option>
            <option>Готовится к отправке</option>
            <option>Отказался от отправки</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">
            Выплачено <span className="text-[#C9A84C]">({paymentAmount})</span>
          </label>
          <select className={inp} value={form.payment_made} onChange={e => set('payment_made', e.target.value)}>
            <option value="">Не указано</option>
            <option value="Нет">Нет</option>
            <option value="Да">Да</option>
          </select>
        </div>
      </div>
    </div>
  );
}
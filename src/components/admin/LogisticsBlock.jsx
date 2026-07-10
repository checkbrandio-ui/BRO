import { Navigation, Upload, Trash2, Phone, PhoneOff, CheckCircle, Zap } from 'lucide-react';
import { uploadWithRetry } from '@/lib/uploadWithRetry';
import { LOGISTICS_STATUS } from '@/lib/candidateConstants';
import LogisticsHistory from './LogisticsHistory';
import { formatDate } from '@/lib/formatDate';

/**
 * Блок логистики и согласования — вынесен из CandidateModal для читаемости.
 * Все действия (отправка на согласование, подтверждение, пересогласование)
 * сохраняются мгновенно через instantLogisticsSave.
 */
export default function LogisticsBlock({
  form,
  set,
  candidate,
  instantLogisticsSave,
  handleAssemblyPointChange,
  assemblyPoints,
  inp,
}) {
  // Куратор выбранной точки сбора
  const selectedPoint = assemblyPoints?.find(ap => ap.name === form.assembly_point);
  const curator = selectedPoint?.curator_name || selectedPoint?.curator_phone
    ? { name: selectedPoint.curator_name, phone: selectedPoint.curator_phone }
    : null;

  return (
    <div className="rounded-xl bg-[rgba(123,63,191,0.06)] border border-[rgba(123,63,191,0.25)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-[#C9A84C] font-bold uppercase tracking-widest flex items-center gap-1.5">
          <Navigation size={13} /> Логистика и согласование
        </div>
        {form.logistics_status && form.logistics_status !== 'none' && (
          <span className={`text-xs px-2 py-1 rounded ${LOGISTICS_STATUS[form.logistics_status]?.bg || ''} ${LOGISTICS_STATUS[form.logistics_status]?.color || ''}`}>
            {LOGISTICS_STATUS[form.logistics_status]?.icon} {LOGISTICS_STATUS[form.logistics_status]?.label}
          </span>
        )}
      </div>

      {/* Поля логистики: пункт сбора, дата, время */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Пункт сбора</label>
          <select className={inp} value={form.assembly_point} onChange={e => handleAssemblyPointChange(e.target.value)}>
            <option value="">Выберите...</option>
            {assemblyPoints.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Дата прибытия</label>
          <input className={inp + (form.arrival_date ? '' : ' text-[#F8FAFC]/30')} type="date" value={form.arrival_date} onChange={e => set('arrival_date', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Время прибытия</label>
          <input className={inp + (form.arrival_time ? '' : ' text-[#F8FAFC]/30')} type="time" value={form.arrival_time} onChange={e => set('arrival_time', e.target.value)} />
        </div>
      </div>

      {/* Предложение от кандидата/менеджера (для админа — pending_admin) */}
      {form.logistics_status === 'pending_admin' && form.proposed_assembly_point && (
        <div className="p-3 rounded-lg bg-[#C9A84C]/8 border border-[#C9A84C]/20">
          <div className="text-xs text-[#C9A84C] font-bold mb-2">Предложено ({form.proposed_by || 'кандидатом'}):</div>
          <div className="text-xs text-[#F8FAFC]/60 space-y-0.5">
            {form.proposed_assembly_point && <div>📍 Пункт сбора: {form.proposed_assembly_point}</div>}
            {form.proposed_arrival_date && <div>📅 Дата: {formatDate(form.proposed_arrival_date)}</div>}
            {form.proposed_arrival_time && <div>⏰ Время: {form.proposed_arrival_time}</div>}
          </div>
        </div>
      )}

      {/* Фото билета с предпросмотром */}
      <div>
        <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Фото билета</label>
        {form.ticket_photo_url ? (
          <div className="flex items-center gap-3">
            <a href={form.ticket_photo_url} target="_blank" rel="noreferrer" className="block flex-shrink-0">
              <img src={form.ticket_photo_url} alt="Билет" className="w-16 h-16 object-cover rounded-lg border border-[rgba(123,63,191,0.3)] hover:border-[#C9A84C] transition-all" />
            </a>
            <div className="flex flex-col gap-1">
              <a href={form.ticket_photo_url} target="_blank" rel="noreferrer" className="text-xs text-[#C9A84C] underline">Открыть в полном размере</a>
              <button type="button" onClick={() => set('ticket_photo_url', '')} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 w-fit">
                <Trash2 size={11} /> Удалить
              </button>
            </div>
          </div>
        ) : (
          <label className="flex items-center gap-1.5 px-3 py-2 rounded border border-[rgba(123,63,191,0.3)] text-[#7B3FBF] hover:bg-[rgba(123,63,191,0.1)] text-xs cursor-pointer transition-all w-fit">
            <Upload size={11} /> Загрузить фото билета
            <input type="file" className="hidden" accept="image/*,.pdf"
              onChange={async e => {
                const file = e.target.files?.[0]; if (!file) return;
                try { const url = await uploadWithRetry(file); set('ticket_photo_url', url); } catch (err) { alert('Ошибка загрузки: ' + err.message); }
              }} />
          </label>
        )}
      </div>

      {/* Принудительное согласование — админ ставит выбранную точку/дату/время без зависимостей */}
      {candidate?.id && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#C9A84C]/8 border border-[#C9A84C]/20">
          <Zap size={13} className="text-[#C9A84C] flex-shrink-0" />
          <button type="button" onClick={() => {
            const ts = new Date().toISOString();
            const updates = {
              assembly_point: form.assembly_point,
              arrival_date: form.arrival_date,
              arrival_time: form.arrival_time,
              logistics_status: 'confirmed',
              logistics_confirmed_at: ts,
              proposed_assembly_point: '',
              proposed_arrival_date: '',
              proposed_arrival_time: '',
              proposed_by: '',
            };
            set('logistics_status', 'confirmed');
            set('logistics_confirmed_at', ts);
            set('proposed_assembly_point', '');
            set('proposed_arrival_date', '');
            set('proposed_arrival_time', '');
            set('proposed_by', '');
            instantLogisticsSave(updates);
          }} className="text-xs font-bold text-[#C9A84C] hover:text-[#D9B85C] transition-colors">
            ⚡ Принудительное согласование
          </button>
          <span className="text-[10px] text-[#F8FAFC]/30">Мгновенно утверждает текущие данные без ожидания</span>
        </div>
      )}

      {/* Кнопки управления логистикой */}
      <div className="flex flex-wrap gap-2">
        {form.logistics_status === 'none' && candidate?.id && (
          <button type="button" onClick={() => {
            const updates = {
              proposed_assembly_point: form.assembly_point,
              proposed_arrival_date: form.arrival_date,
              proposed_arrival_time: form.arrival_time,
              proposed_by: 'admin',
              logistics_status: 'pending_candidate',
            };
            set('proposed_assembly_point', form.assembly_point);
            set('proposed_arrival_date', form.arrival_date);
            set('proposed_arrival_time', form.arrival_time);
            set('proposed_by', 'admin');
            set('logistics_status', 'pending_candidate');
            instantLogisticsSave(updates);
          }} className="px-3 py-1.5 text-xs rounded border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all">
            Отправить на согласование
          </button>
        )}
        {form.logistics_status === 'pending_admin' && (
          <>
            <button type="button" onClick={() => {
              const ts = new Date().toISOString();
              const updates = {
                assembly_point: form.proposed_assembly_point || form.assembly_point,
                arrival_date: form.proposed_arrival_date || form.arrival_date,
                arrival_time: form.proposed_arrival_time || form.arrival_time,
                logistics_status: 'confirmed',
                logistics_confirmed_at: ts,
              };
              set('assembly_point', updates.assembly_point);
              set('arrival_date', updates.arrival_date);
              set('arrival_time', updates.arrival_time);
              set('logistics_status', 'confirmed');
              set('logistics_confirmed_at', ts);
              instantLogisticsSave(updates);
            }} className="px-3 py-1.5 text-xs rounded bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 transition-all">
              ✓ Подтвердить предложенные данные
            </button>
            <button type="button" onClick={() => {
              const updates = {
                proposed_assembly_point: '',
                proposed_arrival_date: '',
                proposed_arrival_time: '',
                proposed_by: '',
                logistics_status: 'none',
              };
              set('proposed_assembly_point', '');
              set('proposed_arrival_date', '');
              set('proposed_arrival_time', '');
              set('proposed_by', '');
              set('logistics_status', 'none');
              instantLogisticsSave(updates);
            }} className="px-3 py-1.5 text-xs rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
              Отклонить
            </button>
          </>
        )}
        {form.logistics_status === 'pending_candidate' && (
          <button type="button" onClick={() => {
            const ts = new Date().toISOString();
            set('logistics_status', 'confirmed');
            set('logistics_confirmed_at', ts);
            instantLogisticsSave({
              logistics_status: 'confirmed',
              logistics_confirmed_at: ts,
              assembly_point: form.assembly_point,
              arrival_date: form.arrival_date,
              arrival_time: form.arrival_time,
            });
          }} className="px-3 py-1.5 text-xs rounded bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 transition-all">
            ✓ Подтвердить окончательно
          </button>
        )}
        {form.logistics_status === 'confirmed' && (
          <button type="button" onClick={() => {
            set('logistics_status', 'none');
            set('logistics_confirmed_at', '');
            instantLogisticsSave({ logistics_status: 'none', logistics_confirmed_at: '' });
          }} className="px-3 py-1.5 text-xs rounded border border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/50 hover:text-[#F8FAFC] transition-all">
            Пересогласовать
          </button>
        )}
      </div>

      {/* Финальный прозвон кандидата */}
      {candidate?.id && (
        <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${form.final_call_confirmed ? 'bg-green-500/8 border-green-500/30' : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.08)]'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${form.final_call_confirmed ? 'bg-green-500/20 border border-green-500/40' : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]'}`}>
              {form.final_call_confirmed
                ? <CheckCircle size={15} className="text-green-400" />
                : <Phone size={15} className="text-[#F8FAFC]/30" />}
            </div>
            <div>
              <p className={`text-sm font-bold ${form.final_call_confirmed ? 'text-green-400' : 'text-[#F8FAFC]/60'}`}>
                {form.final_call_confirmed ? 'Финальное согласование получено' : 'Финальный прозвон не проведён'}
              </p>
              {form.final_call_confirmed_at && (
                <p className="text-[10px] text-[#F8FAFC]/35">
                  {new Date(form.final_call_confirmed_at).toLocaleString('ru-RU')}
                </p>
              )}
            </div>
          </div>
          {form.final_call_confirmed ? (
            <button type="button" onClick={() => {
              set('final_call_confirmed', false);
              set('final_call_confirmed_at', '');
              instantLogisticsSave({ final_call_confirmed: false, final_call_confirmed_at: '' });
            }} className="px-3 py-1.5 text-xs rounded border border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/50 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center gap-1.5 whitespace-nowrap">
              <PhoneOff size={12} /> Отменить
            </button>
          ) : (
            <button type="button" onClick={() => {
              const ts = new Date().toISOString();
              set('final_call_confirmed', true);
              set('final_call_confirmed_at', ts);
              instantLogisticsSave({ final_call_confirmed: true, final_call_confirmed_at: ts });
            }} className="px-3 py-1.5 text-xs rounded bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 transition-all flex items-center gap-1.5 whitespace-nowrap">
              <Phone size={12} /> Подтвердить прозвон
            </button>
          )}
        </div>
      )}

      {/* Куратор точки сбора */}
      {curator && form.logistics_status === 'confirmed' && (
        <div className="p-3 rounded-lg bg-[#C9A84C]/8 border border-[#C9A84C]/20">
          <p className="text-xs text-[#C9A84C] font-bold mb-1">👤 Куратор точки сбора</p>
          {curator.name && <p className="text-sm text-[#F8FAFC] font-semibold">{curator.name}</p>}
          {curator.phone && <p className="text-lg text-[#C9A84C] font-bold tracking-wide">{curator.phone}</p>}
        </div>
      )}

      {/* История логистики — единый блок внутри раздела */}
      {candidate?.id && (
        <div className="pt-2 border-t border-[rgba(123,63,191,0.15)]">
          <LogisticsHistory candidateId={candidate.id} defaultExpanded />
        </div>
      )}
    </div>
  );
}
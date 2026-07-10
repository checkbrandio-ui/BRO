import { X, ClipboardCopy, Link2, Loader2, Users, Phone } from 'lucide-react';

export default function BulkActionsBar({ selectedCount, onClear, onApplyStatus, onCopyLinks, onGenerateForms, onFinalCall, busy, canEditStatuses, missingFormsCount }) {
  if (selectedCount === 0) return null;
  const sel = "px-2.5 py-1.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg text-xs text-[#F8FAFC] focus:outline-none focus:border-[#7B3FBF] disabled:opacity-50 cursor-pointer";

  return (
    <div className="mb-4 flex items-center gap-2 sm:gap-3 flex-wrap px-4 py-3 rounded-xl bg-[#7B3FBF]/10 border border-[#7B3FBF]/30">
      <div className="flex items-center gap-2">
        <Users size={15} className="text-[#7B3FBF]" />
        <span className="text-sm font-bold text-[#F8FAFC]">Выбрано: {selectedCount}</span>
      </div>
      <button onClick={onClear} className="p-1.5 rounded hover:bg-white/10 text-[#F8FAFC]/50 hover:text-[#F8FAFC] transition-all" title="Снять выделение">
        <X size={14} />
      </button>
      <div className="h-5 w-px bg-[rgba(123,63,191,0.2)]" />

      {canEditStatuses && (
        <>
          <select onChange={e => { const v = e.target.value; if (v) { onApplyStatus('sb_check', v); e.target.value = ''; } }} className={sel} disabled={busy}>
            <option value="">⚖ СБ...</option>
            <option>Не проверялся</option><option>На проверке</option><option>Согласован</option><option>Не согласован</option>
          </select>
          <select onChange={e => { const v = e.target.value; if (v) { onApplyStatus('medical_check', v); e.target.value = ''; } }} className={sel} disabled={busy}>
            <option value="">⚕ Мед...</option>
            <option>Не проверялся</option><option>Прошёл</option><option>Не прошёл</option>
          </select>
          <select onChange={e => { const v = e.target.value; if (v) { onApplyStatus('payment_basis', v); e.target.value = ''; } }} className={sel} disabled={busy}>
            <option value="">💰 Выплата...</option>
            <option>Готовится к отправке</option><option>Отказался от отправки</option>
          </select>
          <select onChange={e => { const v = e.target.value; if (v) { onApplyStatus('payment_made', v); e.target.value = ''; } }} className={sel} disabled={busy}>
            <option value="">✓ Выплачено...</option>
            <option>Нет</option><option>Да</option>
          </select>
          <div className="h-5 w-px bg-[rgba(123,63,191,0.2)]" />
        </>
      )}

      <button onClick={onFinalCall} disabled={busy}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all disabled:opacity-50">
        {busy ? <Loader2 size={13} className="animate-spin"/> : <Phone size={13}/>} Финальный прозвон
      </button>

      {missingFormsCount > 0 && (
        <button onClick={onGenerateForms} disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin"/> : <Link2 size={13}/>} Создать анкеты ({missingFormsCount})
        </button>
      )}

      <button onClick={onCopyLinks} disabled={busy}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] transition-all disabled:opacity-50 ml-auto">
        {busy ? <Loader2 size={13} className="animate-spin"/> : <ClipboardCopy size={13}/>} Копировать ссылки
      </button>
    </div>
  );
}
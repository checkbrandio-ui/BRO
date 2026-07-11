import {
  MapPin, Shield, Stethoscope, CalendarDays, Phone, CheckCircle,
  Banknote, FileCheck, AlertTriangle, Edit2, ClipboardCopy, Mail,
  RefreshCw, Archive, ArchiveRestore, Trash2, Loader2, Navigation,
} from 'lucide-react';
import { SB_BADGE, MED_BADGE, LOGISTICS_STATUS, isCIS } from '@/lib/candidateConstants';
import { hasMissingRequiredDocs, getMissingRequiredDocs } from '@/lib/docUtils';

const PAY_COLORS = { 'Готовится к отправке': 'text-green-400', 'Отказался от отправки': 'text-red-400/70' };
const isArchivable = (c) => c.payment_made === 'Да' || c.payment_basis === 'Отказался от отправки';

export default function CandidateMobileCard({
  c, isSelected, onToggle, onEdit, onCopyLink, onRegenerate, onSendEmail,
  onAutoAssembly, onGenerateForm, isDuplicate, animatingId, showArchive, onArchive, onUnarchive, onDelete,
}) {
  const missingDocs = hasMissingRequiredDocs(c) ? getMissingRequiredDocs(c.documents || []) : [];

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      isDuplicate
        ? 'bg-red-500/8 border-red-500/30'
        : isSelected
          ? 'bg-[#7B3FBF]/12 border-[#7B3FBF]/40'
          : 'glass-card border-[rgba(123,63,191,0.12)]'
    }`}>
      {/* Row 1: checkbox + name + status badges */}
      <div className="flex items-start gap-2">
        {!showArchive && (
          <input type="checkbox" checked={isSelected} onChange={() => onToggle(c.id)}
            className="w-4 h-4 mt-1 rounded border-[rgba(123,63,191,0.3)] bg-transparent accent-[#7B3FBF] cursor-pointer flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isDuplicate && <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />}
            {missingDocs.length > 0 && <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />}
            <span className={`font-bold text-sm truncate ${isDuplicate ? 'text-red-300' : 'text-[#F8FAFC]'}`}>
              {c.full_name}
            </span>
            {isCIS(c.citizenship) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/25">
                {c.citizenship}
              </span>
            )}
          </div>
          <div className="text-xs text-[#F8FAFC]/35 mt-0.5">{c.agency_name || '—'}</div>
        </div>
        {/* SB + Med badges compact */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${SB_BADGE[c.sb_check]?.bg || 'bg-[#F8FAFC]/5'} ${SB_BADGE[c.sb_check]?.color || 'text-[#F8FAFC]/40'} ${SB_BADGE[c.sb_check]?.border || 'border-[#F8FAFC]/10'}`}>
            {SB_BADGE[c.sb_check]?.icon || '○'} СБ
          </span>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${MED_BADGE[c.medical_check]?.bg || 'bg-[#F8FAFC]/5'} ${MED_BADGE[c.medical_check]?.color || 'text-[#F8FAFC]/40'} ${MED_BADGE[c.medical_check]?.border || 'border-[#F8FAFC]/10'}`}>
            {MED_BADGE[c.medical_check]?.icon || '○'} Мед
          </span>
        </div>
      </div>

      {/* Row 2: key info grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 text-xs">
        <div className="flex items-center gap-1.5 text-[#F8FAFC]/55">
          <span className="text-[#F8FAFC]/30 text-[10px]">Должность:</span>
          <span className="truncate">{c.position || '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#F8FAFC]/55">
          <MapPin size={11} className="opacity-40 flex-shrink-0" />
          <span className="truncate">{c.city || '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#F8FAFC]/55">
          <CalendarDays size={11} className="opacity-40 flex-shrink-0" />
          <span className="truncate">{c.arrival_date ? c.arrival_date.split('-').reverse().join('.') : '—'}{c.arrival_time ? ` ${c.arrival_time}` : ''}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#F8FAFC]/55">
          <Banknote size={11} className="opacity-40 flex-shrink-0" />
          <span className={`truncate ${PAY_COLORS[c.payment_basis] || 'text-[#F8FAFC]/40'}`}>
            {c.payment_made === 'Да' ? '✓ Выплачено' : c.payment_basis || '—'}
          </span>
        </div>
      </div>

      {/* Assembly point + logistics */}
      {(c.assembly_point || (c.logistics_status && c.logistics_status !== 'none')) && (
        <div className="flex items-center gap-2 mt-1 text-xs text-[#F8FAFC]/45 flex-wrap">
          {c.assembly_point && (
            <span className="inline-flex items-center gap-1">
              <Navigation size={10} className="opacity-40" />
              {c.assembly_point}
              {c.assembly_distance && <span className="text-[#C9A84C]">({c.assembly_distance} км)</span>}
            </span>
          )}
          {c.logistics_status && c.logistics_status !== 'none' && (
            <span className={LOGISTICS_STATUS[c.logistics_status]?.color || 'text-[#F8FAFC]/30'}>
              {LOGISTICS_STATUS[c.logistics_status]?.icon} {LOGISTICS_STATUS[c.logistics_status]?.label}
            </span>
          )}
        </div>
      )}

      {/* Final call + form status */}
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        {c.final_call_confirmed ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-green-400">
            <CheckCircle size={11} /> Прозвон ✓
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#F8FAFC]/25">
            <Phone size={11} /> Не прозвонен
          </span>
        )}
        {c.form_status === 'completed' && (
          <a href={`/form/${c.form_token}?edit=1`} target="_blank" rel="noreferrer"
            className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/25">
            ✓ Анкета
          </a>
        )}
        {(() => {
          const genDocs = (c.documents || []).filter(d => d.type === 'generated');
          if (genDocs.length > 0) {
            return (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#C9A84C]">
                <FileCheck size={11} /> {genDocs.length} док.
              </span>
            );
          }
          return null;
        })()}
      </div>

      {/* Missing docs warning */}
      {missingDocs.length > 0 && (
        <div className="mt-2 px-2 py-1.5 rounded-lg bg-red-500/8 border border-red-500/20 text-[10px] text-red-400/80">
          Не хватает: {missingDocs.map(m => m.label).join(', ')}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 mt-2.5 pt-2.5 border-t border-[rgba(123,63,191,0.1)]">
        {showArchive ? (
          <>
            <button onClick={() => onUnarchive(c)} className="p-2 rounded-lg hover:bg-green-500/15 text-[#F8FAFC]/50 hover:text-green-400 transition-all">
              <ArchiveRestore size={15} />
            </button>
            <button onClick={() => onDelete(c.id)} className="p-2 rounded-lg hover:bg-red-500/15 text-[#F8FAFC]/50 hover:text-red-400 transition-all">
              <Trash2 size={15} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onEdit(c)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#7B3FBF]/15 border border-[#7B3FBF]/30 text-[#7B3FBF] hover:bg-[#7B3FBF]/25 transition-all font-semibold">
              <Edit2 size={13} /> Открыть
            </button>
            {c.form_status === 'completed' && c.city && (
              <button onClick={() => onAutoAssembly(c)} disabled={animatingId === c.id}
                className={`p-2 rounded-lg transition-all ${animatingId === c.id ? 'opacity-50' : c.assembly_point ? 'bg-[#C9A84C]/15 text-[#C9A84C] hover:bg-[#C9A84C]/25' : 'text-[#F8FAFC]/40 hover:bg-[#C9A84C]/15 hover:text-[#C9A84C]'}`}>
                {animatingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
              </button>
            )}
            {c.form_token && c.form_status !== 'completed' && (
              <>
                <button onClick={() => onCopyLink(c)} className="p-2 rounded-lg hover:bg-[#7B3FBF]/15 text-[#F8FAFC]/40 hover:text-[#7B3FBF] transition-all">
                  <ClipboardCopy size={14} />
                </button>
                <button onClick={() => onRegenerate(c)} className="p-2 rounded-lg hover:bg-red-500/15 text-[#F8FAFC]/40 hover:text-red-400 transition-all">
                  <RefreshCw size={14} />
                </button>
                {c.email && (
                  <button onClick={() => onSendEmail(c)} className="p-2 rounded-lg hover:bg-[#C9A84C]/15 text-[#F8FAFC]/40 hover:text-[#C9A84C] transition-all">
                    <Mail size={14} />
                  </button>
                )}
              </>
            )}
            {!c.form_token && (
              <button onClick={() => onGenerateForm(c)} className="text-xs text-[#7B3FBF] hover:text-[#8B4FCF] px-2 py-1.5 rounded-lg hover:bg-[#7B3FBF]/10 transition-all">
                + Анкета
              </button>
            )}
            {isArchivable(c) && (
              <button onClick={() => onArchive(c)} className="p-2 rounded-lg hover:bg-[#C9A84C]/15 text-[#F8FAFC]/40 hover:text-[#C9A84C] transition-all ml-auto">
                <Archive size={14} />
              </button>
            )}
            <button onClick={() => onDelete(c.id)} className="p-2 rounded-lg hover:bg-red-500/15 text-[#F8FAFC]/40 hover:text-red-400 transition-all">
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
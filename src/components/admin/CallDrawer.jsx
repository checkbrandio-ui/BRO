import { useState } from 'react';
import { X, Phone, Copy, Check, Save } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import { CALL_SCRIPT_BLOCKS } from '@/lib/callScripts';

/**
 * Drawer для звонка кандидату.
 * Содержит: tel: ссылку, выбор блока скрипта, диктофон, заметки.
 * Заметки + транскрипция + ссылка на запись сохраняются в комментарий кандидата.
 */
export default function CallDrawer({ candidate, onClose, onSaveNotes }) {
  const [activeBlock, setActiveBlock] = useState(0);
  const [callNotes, setCallNotes] = useState('');
  const [recordData, setRecordData] = useState({ url: null, transcript: null });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const phone = candidate?.phone || '';
  const name = candidate?.full_name || 'Кандидат';

  const handleCopyScript = () => {
    navigator.clipboard.writeText(CALL_SCRIPT_BLOCKS[activeBlock].text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveNotes?.({
        notes: callNotes,
        audioUrl: recordData.url,
        transcript: recordData.transcript,
      });
    } finally {
      setSaving(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D1B3E] border-l border-[rgba(123,63,191,0.25)] w-full max-w-md h-full overflow-y-auto shadow-2xl drawer-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(123,63,191,0.15)] sticky top-0 bg-[#0D1B3E] z-10">
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-green-400" />
            <h2 className="text-sm font-bold text-[#F8FAFC]">Звонок кандидату</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all text-[#F8FAFC]/60">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Candidate info + tel link */}
          <div className="p-3 rounded-lg bg-[rgba(123,63,191,0.08)] border border-[rgba(123,63,191,0.2)]">
            <div className="text-sm font-bold text-[#F8FAFC]">{name}</div>
            {phone && (
              <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                className="flex items-center gap-1.5 mt-1 text-lg text-green-400 font-bold hover:text-green-300 transition-colors">
                <Phone size={14} /> {phone}
              </a>
            )}
          </div>

          {/* Script blocks selector */}
          <div>
            <div className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">Скрипт разговора</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CALL_SCRIPT_BLOCKS.map((block, i) => (
                <button key={block.id} onClick={() => setActiveBlock(i)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-all border ${activeBlock === i ? 'bg-[#7B3FBF]/20 border-[#7B3FBF]/50 text-[#7B3FBF] font-bold' : 'border-[rgba(255,255,255,0.08)] text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70 hover:border-[#7B3FBF]/30'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs font-bold text-[#F8FAFC]/70">{CALL_SCRIPT_BLOCKS[activeBlock].label}</div>
              <button onClick={handleCopyScript} className="flex items-center gap-1 text-[10px] text-[#7B3FBF] hover:text-[#8B4FCF] transition-colors">
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'Скопировано' : 'Копировать'}
              </button>
            </div>
            <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(123,63,191,0.12)] text-xs text-[#F8FAFC]/65 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {CALL_SCRIPT_BLOCKS[activeBlock].text}
            </div>
          </div>

          {/* Voice recorder */}
          <div>
            <div className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">Запись разговора</div>
            <VoiceRecorder onRecorded={(url, transcript) => setRecordData({ url, transcript })} />
          </div>

          {/* Call notes */}
          <div>
            <div className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">Заметки по звонку</div>
            <textarea
              value={callNotes}
              onChange={e => setCallNotes(e.target.value)}
              placeholder="Запишите ключевые моменты разговора, договорённости, вопросы кандидата..."
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/25 focus:outline-none focus:border-[#7B3FBF] transition-all resize-y min-h-[100px]"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#7B3FBF] text-white font-bold text-sm hover:bg-[#8B4FCF] transition-all disabled:opacity-50">
            {saving ? 'Сохранение...' : <><Save size={14} /> Сохранить заметки звонка</>}
          </button>
          <p className="text-center text-[10px] text-[#F8FAFC]/30">
            Записи старше 30 дней удаляются автоматически
          </p>
        </div>
      </div>
    </div>
  );
}
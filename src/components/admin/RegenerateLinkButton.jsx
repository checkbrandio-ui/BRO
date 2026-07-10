import { useState } from 'react';
import { RefreshCw, Loader2, AlertTriangle, Copy, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Кнопка перевыпуска ссылки на анкету кандидата.
 * Старая ссылка аннулируется, создаётся новый токен.
 */
export default function RegenerateLinkButton({ candidate, onRegenerated }) {
  const [regenerating, setRegenerating] = useState(false);
  const [newToken, setNewToken] = useState(candidate?.form_token || '');
  const [copied, setCopied] = useState(false);

  const formUrl = newToken ? `${window.location.origin}/anketa/${newToken}` : '';

  const handleRegenerate = async () => {
    if (!candidate?.id) return;
    if (!confirm(`Перевыпустить ссылку на анкету для «${candidate.full_name}»?\n\nСтарая ссылка перестанет работать немедленно.`)) return;
    setRegenerating(true);
    try {
      const token = 'cf-' + Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 10);
      await base44.entities.Candidate.update(candidate.id, { form_token: token, form_status: 'pending' });
      if (candidate.form_token) {
        const oldForms = await base44.entities.CandidateForm.filter({ form_token: candidate.form_token });
        if (oldForms.length > 0) {
          await base44.entities.CandidateForm.update(oldForms[0].id, { form_token: token });
        }
      } else {
        await base44.entities.CandidateForm.create({ candidate_id: candidate.id, form_token: token, status: 'pending' });
      }
      setNewToken(token);
      if (onRegenerated) onRegenerated(token);
    } catch (e) {
      alert('Ошибка перевыпуска ссылки: ' + e.message);
    }
    setRegenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(123,63,191,0.12)] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw size={14} className="text-[#7B3FBF]" />
        <h4 className="text-xs font-bold text-[#7B3FBF] uppercase tracking-widest">Ссылка на анкету</h4>
      </div>

      {formUrl && (
        <div className="flex items-center gap-2 mb-3">
          <input
            readOnly
            value={formUrl}
            className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(123,63,191,0.15)] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]/60 truncate"
          />
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(123,63,191,0.3)] text-[#7B3FBF] hover:bg-[rgba(123,63,191,0.1)] text-xs transition-all whitespace-nowrap">
            {copied ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
        </div>
      )}

      <button onClick={handleRegenerate} disabled={regenerating}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/20 text-red-400/80 hover:bg-red-500/10 hover:text-red-400 text-xs transition-all disabled:opacity-50">
        {regenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        {regenerating ? 'Перевыпуск...' : 'Перевыпустить ссылку (старая аннулируется)'}
      </button>
      <p className="text-[10px] text-[#F8FAFC]/20 mt-1.5 text-center flex items-center justify-center gap-1">
        <AlertTriangle size={9} /> Используйте, если ссылка попала к третьим лицам
      </p>
    </div>
  );
}
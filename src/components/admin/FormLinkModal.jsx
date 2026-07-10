import { useState } from 'react';
import { X, Copy, Mail, CheckCircle, Loader2, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function FormLinkModal({ candidate, onClose, onRegenerate }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [currentToken, setCurrentToken] = useState(candidate?.form_token || '');

  const formUrl = currentToken ? `${window.location.origin}/anketa/${currentToken}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
  };

  const handleSendEmail = async () => {
    if (!candidate?.email) return;
    setSending(true);
    setEmailError(null);
    try {
      await base44.integrations.Core.SendEmail({
        to: candidate.email,
        subject: 'Заполнение анкеты кандидата — БРО-СНБ',
        body: `Здравствуйте, ${candidate.full_name}!\n\nПросим вас заполнить онлайн-анкету по ссылке:\n${formUrl}\n\nЗаполнение займёт около 10 минут.\n\nС уважением,\nООО «БРО-СНБ»`,
        from_name: 'БРО-СНБ',
      });
      setEmailSent(true);
    } catch (e) {
      setEmailError('Не удалось отправить письмо. Попробуйте скопировать ссылку.');
    }
    setSending(false);
  };

  const handleRegenerate = async () => {
    if (!candidate?.id) return;
    if (!confirm(`Перевыпустить ссылку на анкету для «${candidate.full_name}»?\n\nСтарая ссылка перестанет работать немедленно.`)) return;
    setRegenerating(true);
    try {
      const newToken = 'cf-' + Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 10);
      await base44.entities.Candidate.update(candidate.id, { form_token: newToken, form_status: 'pending' });
      // Деактивируем старую анкету и создаём новую
      if (candidate.form_token) {
        const oldForms = await base44.entities.CandidateForm.filter({ form_token: candidate.form_token });
        if (oldForms.length > 0) {
          await base44.entities.CandidateForm.update(oldForms[0].id, { form_token: newToken });
        }
      } else {
        await base44.entities.CandidateForm.create({ candidate_id: candidate.id, form_token: newToken, status: 'pending' });
      }
      setCurrentToken(newToken);
      if (onRegenerate) onRegenerate(newToken);
    } catch (e) {
      alert('Ошибка перевыпуска ссылки: ' + e.message);
    }
    setRegenerating(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D1B3E] border border-[rgba(123,63,191,0.25)] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(123,63,191,0.15)]">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <h2 className="text-base font-bold text-[#F8FAFC]">Кандидат сохранён</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all text-[#F8FAFC]/60"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-[#F8FAFC]/60">
            Карточка кандидата <strong className="text-[#F8FAFC]">«{candidate?.full_name}»</strong> создана.
            Отправьте ссылку на онлайн-анкету, чтобы кандидат заполнил данные и загрузил документы.
          </p>

          {/* Copy link */}
          <button onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#7B3FBF] text-white font-medium text-sm hover:bg-[#8B4FCF] transition-all">
            {copied ? <CheckCircle size={16} className="text-green-300" /> : <Copy size={16} />}
            {copied ? 'Ссылка скопирована — отправьте кандидату' : 'Скопировать ссылку на анкету'}
          </button>

          {/* Send email */}
          {candidate?.email ? (
            <button onClick={handleSendEmail} disabled={sending || emailSent}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[rgba(201,168,76,0.3)] text-[#C9A84C] font-medium text-sm hover:bg-[#C9A84C]/10 transition-all disabled:opacity-50">
              {sending ? <Loader2 size={16} className="animate-spin" /> : emailSent ? <CheckCircle size={16} className="text-green-400" /> : <Mail size={16} />}
              {sending ? 'Отправка...' : emailSent ? 'Письмо отправлено' : `Отправить на ${candidate.email}`}
            </button>
          ) : (
            <div className="text-center px-4 py-3 rounded-lg border border-[rgba(255,255,255,0.06)] text-xs text-[#F8FAFC]/30">
              Email не указан — отправка на почту недоступна. Скопируйте ссылку и отправьте вручную.
            </div>
          )}
          {emailError && <p className="text-xs text-red-400 text-center">{emailError}</p>}

          {/* Open form link */}
          <a href={formUrl} target="_blank" rel="noreferrer"
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs text-[#F8FAFC]/35 hover:text-[#7B3FBF] transition-all">
            <ExternalLink size={12} /> Открыть анкету в новой вкладке
          </a>
        </div>
      </div>
    </div>
  );
}
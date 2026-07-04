import { useState, useEffect } from 'react';
import { ClipboardCopy, Mail, ExternalLink, X, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FormLinkModal({ candidate, onClose }) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const url = `${window.location.origin}/form/${candidate.form_token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
    });
  };

  const handleSendEmail = async () => {
    if (!candidate.email) return;
    setSending(true);
    try {
      const response = await base44.functions.invoke('sendFormLink', {
        to: candidate.email,
        candidate_name: candidate.full_name,
        form_url: url,
      });
      if (response.error) throw new Error(response.error);
      setSent(true);
    } catch (e) {
      console.error('sendFormLink error:', e);
      // Fallback: open mailto
      const subject = encodeURIComponent('Заполнение анкеты кандидата — Bratouveriye SNB');
      const body = encodeURIComponent(
        `Здравствуйте, ${candidate.full_name}!\n\nПросим вас заполнить онлайн-анкету по ссылке:\n${url}\n\nЗаполнение займёт около 10 минут.\n\nС уважением,\nООО «Братоуверие-СНБ»`
      );
      window.open(`mailto:${candidate.email}?subject=${subject}&body=${body}`, '_blank');
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  // Auto-close after 30 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 30000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />

      {/* Modal */}
      <div className='relative w-full max-w-md mx-4 bg-[#0D1B3E] border border-[rgba(123,63,191,0.4)] rounded-2xl shadow-2xl overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-[rgba(123,63,191,0.2)]'>
          <div>
            <div className='text-sm font-bold text-[#F8FAFC]'>Анкета кандидата</div>
            <div className='text-xs text-[#F8FAFC]/40 mt-0.5'>{candidate.full_name}</div>
          </div>
          <button onClick={onClose} className='p-1.5 rounded-lg hover:bg-[rgba(123,63,191,0.2)] text-[#F8FAFC]/40 hover:text-[#F8FAFC] transition-all'>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className='p-5 space-y-4'>
          {/* URL field */}
          <div>
            <div className='text-xs text-[#F8FAFC]/40 mb-2'>Ссылка на анкету</div>
            <div className='flex items-center gap-2'>
              <input
                type='text'
                readOnly
                value={url}
                className='flex-1 px-3 py-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg text-xs text-[#F8FAFC]/70 font-mono'
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  copied
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-[#7B3FBF]/20 text-[#7B3FBF] border border-[#7B3FBF]/30 hover:bg-[#7B3FBF]/30'
                }`}
              >
                {copied ? <CheckCircle size={13} /> : <ClipboardCopy size={13} />}
                {copied ? 'Скопировано' : 'Копировать'}
              </button>
            </div>
          </div>

          {/* Success message */}
          {copied && (
            <div className='flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400'>
              <CheckCircle size={13} className='flex-shrink-0' />
              Ссылка скопирована — отправьте её кандидату любым способом
            </div>
          )}

          {/* Buttons */}
          <div className='flex items-center gap-3'>
            <button
              onClick={handleCopy}
              className='flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] transition-all flex-1 justify-center'
            >
              <ClipboardCopy size={13} />
              Копировать ссылку
            </button>

            {candidate.email && (
              <button
                onClick={handleSendEmail}
                disabled={sending || sent}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${
                  sent
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : sending
                    ? 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 opacity-50'
                    : 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/30'
                }`}
              >
                {sending ? (
                  <><div className='w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin' />Отправка...</>
                ) : sent ? (
                  <><CheckCircle size={13} />Отправлено</>
                ) : (
                  <><Mail size={13} />На email</>
                )}
              </button>
            )}
          </div>

          {/* Open link */}
          <a
            href={`/form/${candidate.form_token}`}
            target='_blank'
            rel='noreferrer'
            className='flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-xs font-medium bg-[rgba(255,255,255,0.04)] text-[#F8FAFC]/50 hover:text-[#7B3FBF] hover:bg-[rgba(123,63,191,0.1)] border border-[rgba(255,255,255,0.08)] transition-all justify-center'
          >
            <ExternalLink size={13} />
            Открыть анкету
          </a>

          {!candidate.email && (
            <div className='text-xs text-[#F8FAFC]/30 text-center'>
              У кандидата не указан email — скопируйте ссылку и отправьте вручную
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-5 py-3 border-t border-[rgba(123,63,191,0.1)] text-xs text-[#F8FAFC]/25 text-center'>
          Окно закроется автоматически через 30 секунд
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { ClipboardCopy, Check, FileText, X } from 'lucide-react';
import { buildSbReport, getSbReportDocs } from '@/lib/candidateConstants';

export default function SbReportButton({ candidate, formDocs, candidateFormData, className }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);

  const docs = getSbReportDocs(candidate, formDocs);

  const handleCopyText = async () => {
    const text = buildSbReport(candidate, formDocs, candidateFormData);
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyUrl = async (url, idx) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedUrl(idx);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  if (docs.length === 0 && !candidate?.full_name) return null;

  return (
    <div className={`w-full ${className || ''}`}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all w-full justify-center"
      >
        <ClipboardCopy size={14} />
        {expanded ? 'Скрыть отчёт для СБ' : '📋 Отчёт для СБ'}
        {expanded && <X size={12} className="ml-auto" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {/* Кнопка копирования текста */}
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs rounded-lg bg-[#7B3FBF]/15 border border-[#7B3FBF]/30 text-[#7B3FBF] hover:bg-[#7B3FBF]/25 transition-all"
          >
            {copiedText ? <Check size={13} className="text-green-400" /> : <ClipboardCopy size={13} />}
            {copiedText ? 'Текст скопирован!' : 'Копировать текст отчёта'}
          </button>

          {/* Отдельные кнопки для каждого изображения */}
          {docs.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-[#F8FAFC]/40 px-1">Изображения (копировать по одной ссылке):</div>
              {docs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(123,63,191,0.12)]"
                >
                  <FileText size={13} className="text-[#C9A84C] flex-shrink-0" />
                  <span className="text-xs text-[#F8FAFC]/70 truncate flex-1">{doc.label}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(doc.url, idx)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-all flex-shrink-0 ${
                      copiedUrl === idx
                        ? 'border-green-500/30 bg-green-500/10 text-green-400'
                        : 'border-[rgba(123,63,191,0.3)] text-[#7B3FBF] hover:bg-[rgba(123,63,191,0.1)]'
                    }`}
                  >
                    {copiedUrl === idx ? <Check size={11} className="text-green-400" /> : <ClipboardCopy size={11} />}
                    {copiedUrl === idx ? '✓' : 'Копировать'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { ClipboardCopy, Check } from 'lucide-react';
import { buildSbReport } from '@/lib/candidateConstants';

export default function SbReportButton({ candidate, formDocs, candidateFormData, className }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all ${className || ''}`}
    >
      {copied ? <Check size={14} className="text-green-400" /> : <ClipboardCopy size={14} />}
      {copied ? 'Скопировано в буфер!' : '📋 Отчёт для СБ'}
    </button>
  );
}
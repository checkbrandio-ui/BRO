import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyBlock({ text, title }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative">
      {title && <div className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">{title}</div>}
      <div className="bg-[#0D1B3E] border border-[rgba(123,63,191,0.2)] rounded-lg p-4 pr-14 text-sm text-[#F8FAFC]/75 leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
      <button onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg bg-[rgba(123,63,191,0.15)] border border-[rgba(123,63,191,0.25)] text-[#F8FAFC]/50 hover:text-[#7B3FBF] hover:bg-[#7B3FBF]/20 transition-all">
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
    </div>
  );
}
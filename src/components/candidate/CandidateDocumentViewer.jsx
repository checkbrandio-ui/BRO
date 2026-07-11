import { useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Printer, Download, ExternalLink, FileText, Maximize2 } from 'lucide-react';

/**
 * Полноэкранный просмотрщик HTML-документов кандидата.
 * Показывает iframe-превью с навигацией между документами пакета.
 */
export default function CandidateDocumentViewer({ docs, onClose }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const iframeRef = useRef(null);

  if (!docs || docs.length === 0) return null;
  const doc = docs[activeIdx];

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#C9A84C]/20 bg-[#0a0a0a]">
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={18} className="text-[#C9A84C] flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#C9A84C] truncate">{doc.name}</div>
            {docs.length > 1 && (
              <div className="text-xs text-[#666]">Документ {activeIdx + 1} из {docs.length}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <a href={doc.url} target="_blank" rel="noreferrer" title="Открыть в новой вкладке"
            className="p-2 rounded-lg hover:bg-[#C9A84C]/10 text-[#888] hover:text-[#C9A84C] transition-all">
            <ExternalLink size={16} />
          </a>
          <a href={doc.url} download title="Скачать"
            className="p-2 rounded-lg hover:bg-[#C9A84C]/10 text-[#888] hover:text-[#C9A84C] transition-all">
            <Download size={16} />
          </a>
          <button onClick={handlePrint} title="Печать / PDF"
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-all font-semibold whitespace-nowrap">
            <Printer size={14} /> Печать
          </button>
          <button onClick={onClose} title="Закрыть"
            className="p-2 rounded-lg hover:bg-red-500/15 text-[#888] hover:text-red-400 transition-all">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {docs.length > 1 && (
        <>
          <button
            onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
            disabled={activeIdx === 0}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setActiveIdx(i => Math.min(docs.length - 1, i + 1))}
            disabled={activeIdx === docs.length - 1}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Document list (bottom bar) */}
      {docs.length > 1 && (
        <div className="px-4 sm:px-6 py-2 border-b border-[#C9A84C]/10 bg-[#0a0a0a] overflow-x-auto">
          <div className="flex gap-1.5">
            {docs.map((d, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-all ${
                  i === activeIdx
                    ? 'bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C]'
                    : 'border border-[#222] text-[#666] hover:text-[#aaa] hover:border-[#333]'
                }`}
              >
                {i + 1}. {d.name.length > 30 ? d.name.substring(0, 30) + '…' : d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* iframe preview */}
      <div className="flex-1 overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
        <iframe
          ref={iframeRef}
          src={doc.url}
          className="w-full h-full bg-white"
          title={doc.name}
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
}
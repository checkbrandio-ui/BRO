import { useState, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  ExternalLink,
  FileText,
  Package,
  Loader2,
  Info,
} from 'lucide-react';
import {
  downloadAllDocuments,
  printAllDocuments,
} from '@/lib/documentDownload';

/**
 * Полноэкранный просмотрщик HTML-документов кандидата.
 * Показывает iframe-превью с навигацией, кнопками скачивания и печати.
 * Поддерживает: скачать всё, печать всех, печать текущего, скачивание отдельного.
 */
export default function CandidateDocumentViewer({ docs, onClose }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [printingAll, setPrintingAll] = useState(false);
  const iframeRef = useRef(null);

  if (!docs || docs.length === 0) return null;
  const doc = docs[activeIdx];

  const handlePrintCurrent = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      await downloadAllDocuments(docs, '');
    } catch (e) {
      docs.forEach((d) => {
        const a = document.createElement('a');
        a.href = d.url;
        a.download = (d.name || 'document') + '.html';
        a.click();
      });
    }
    setDownloadingAll(false);
  };

  const handlePrintAll = async () => {
    setPrintingAll(true);
    try {
      await printAllDocuments(docs);
    } catch (e) {
      handlePrintCurrent();
    }
    setPrintingAll(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-md">
      {/* Шапка с заголовком и глобальными действиями */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#C9A84C]/20 bg-[#0a0a0a]">
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={18} className="text-[#C9A84C] flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#C9A84C] truncate">
              {doc.name}
            </div>
            <div className="text-xs text-[#666]">
              Документ {activeIdx + 1} из {docs.length}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-[#C9A84C] text-[#0a0a0a] hover:bg-[#D9B85C] transition-all font-bold whitespace-nowrap disabled:opacity-50"
          >
            {downloadingAll ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Package size={14} />
            )}
            <span className="hidden sm:inline">Скачать всё</span>
          </button>
          <button
            onClick={handlePrintAll}
            disabled={printingAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-all font-semibold whitespace-nowrap disabled:opacity-50"
          >
            {printingAll ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Printer size={14} />
            )}
            <span className="hidden sm:inline">Печать всех</span>
          </button>
          <button
            onClick={onClose}
            title="Закрыть"
            className="p-2 rounded-lg hover:bg-red-500/15 text-[#888] hover:text-red-400 transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Основная область: сайдбар + превью */}
      <div className="flex-1 flex overflow-hidden">
        {/* Сайдбар со списком документов */}
        <div className="w-56 flex-shrink-0 border-r border-[#C9A84C]/10 bg-[#0a0a0a] overflow-y-auto hidden sm:block">
          <div className="p-3">
            <div className="text-xs font-bold text-[#666] uppercase tracking-widest mb-2 px-2">
              Документы
            </div>
            {docs.map((d, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`w-full flex items-start gap-2 px-3 py-2.5 rounded-lg text-left transition-all mb-1 ${
                  i === activeIdx
                    ? 'bg-[#C9A84C]/15 border border-[#C9A84C]/30'
                    : 'border border-transparent hover:bg-[#C9A84C]/5'
                }`}
              >
                <FileText
                  size={14}
                  className={
                    i === activeIdx
                      ? 'text-[#C9A84C] flex-shrink-0 mt-0.5'
                      : 'text-[#444] flex-shrink-0 mt-0.5'
                  }
                />
                <div className="min-w-0">
                  <div
                    className={`text-xs leading-tight ${
                      i === activeIdx ? 'text-[#C9A84C]' : 'text-[#888]'
                    }`}
                  >
                    {d.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Зона превью */}
        <div className="flex-1 relative bg-[#1a1a1a]">
          {docs.length > 1 && (
            <>
              <button
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() =>
                  setActiveIdx((i) => Math.min(docs.length - 1, i + 1))
                }
                disabled={activeIdx === docs.length - 1}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <iframe
            ref={iframeRef}
            src={doc.url}
            className="w-full h-full bg-white"
            title={doc.name}
            style={{ border: 'none' }}
          />
        </div>
      </div>

      {/* Нижняя панель: действия с текущим документом */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-[#C9A84C]/20 bg-[#0a0a0a] gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-[#555]">
          <Info size={13} className="flex-shrink-0" />
          <span className="hidden sm:inline">
            Нажмите Ctrl+P для печати или сохранения в PDF
          </span>
          <span className="sm:hidden">Ctrl+P — печать</span>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            title="Открыть в новой вкладке"
            className="p-2 rounded-lg hover:bg-[#C9A84C]/10 text-[#888] hover:text-[#C9A84C] transition-all"
          >
            <ExternalLink size={16} />
          </a>
          <a
            href={doc.url}
            download
            title="Скачать этот документ"
            className="p-2 rounded-lg hover:bg-[#C9A84C]/10 text-[#888] hover:text-[#C9A84C] transition-all"
          >
            <Download size={16} />
          </a>
          <button
            onClick={handlePrintCurrent}
            title="Печать текущего"
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-all font-semibold whitespace-nowrap"
          >
            <Printer size={14} /> Печать
          </button>
        </div>
      </div>
    </div>
  );
}
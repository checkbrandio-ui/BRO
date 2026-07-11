import { useState } from 'react';
import {
  FileText,
  Download,
  Package,
  Loader2,
  Info,
  Maximize2,
  ExternalLink,
  Printer,
  CheckCircle,
} from 'lucide-react';
import {
  downloadAllDocuments,
  printAllDocuments,
} from '@/lib/documentDownload';
import DocumentChecklist from '@/components/candidate/DocumentChecklist';

/**
 * Секция «Ваш пакет документов готов» для страницы анкеты кандидата.
 * Показывает кнопки: скачать всё, печать всех, просмотр.
 * Список отдельных документов с индивидуальными кнопками скачивания.
 */
export default function CandidateDocumentsSection({
  documents,
  candidateName,
  onOpenViewer,
}) {
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [done, setDone] = useState(false);

  const docs = (documents || []).filter((d) => d.type === 'generated');
  if (docs.length === 0) return null;

  const handleDownloadAll = async () => {
    setDownloading(true);
    setDone(false);
    try {
      await downloadAllDocuments(docs, candidateName);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      // Fallback — скачиваем по одному
      docs.forEach((d) => {
        const a = document.createElement('a');
        a.href = d.url;
        a.download = (d.name || 'document') + '.html';
        a.click();
      });
    }
    setDownloading(false);
  };

  const handlePrintAll = async () => {
    setPrinting(true);
    try {
      await printAllDocuments(docs);
    } catch (e) {
      window.open(docs[0]?.url, '_blank');
    }
    setPrinting(false);
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#C9A84C]/30 rounded-xl p-5 space-y-4">
      {/* Заголовок и основные кнопки */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center">
            <FileText size={20} className="text-[#C9A84C]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#C9A84C]">
              Ваш пакет документов готов
            </p>
            <p className="text-xs text-[#666]">
              {docs.length} документ(ов) · скачайте, распечатайте и подпишите
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg bg-[#C9A84C] text-[#0a0a0a] hover:bg-[#D9B85C] transition-all font-bold disabled:opacity-50 shadow-lg shadow-[#C9A84C]/20"
          >
            {downloading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : done ? (
              <CheckCircle size={15} />
            ) : (
              <Package size={15} />
            )}
            {downloading ? 'Скачивание...' : done ? 'Скачано!' : 'Скачать всё'}
          </button>
          <button
            onClick={handlePrintAll}
            disabled={printing}
            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-all font-semibold disabled:opacity-50"
          >
            {printing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Printer size={15} />
            )}
            Печать всех
          </button>
          <button
            onClick={onOpenViewer}
            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border border-[rgba(123,63,191,0.3)] text-[#7B3FBF] hover:bg-[#7B3FBF]/10 transition-all font-semibold"
          >
            <Maximize2 size={15} /> Просмотр
          </button>
        </div>
      </div>

      {/* Инструкция */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-[#C9A84C]/5 border border-[#C9A84C]/15">
        <Info size={14} className="text-[#C9A84C] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#888] leading-relaxed">
          <p className="font-bold text-[#aaa] mb-1">Как получить документы:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>
              Нажмите <strong className="text-[#C9A84C]">«Скачать всё»</strong> — все документы сохранятся одним файлом
            </li>
            <li>Откройте скачанный файл в браузере (двойной клик)</li>
            <li>
              Нажмите <strong className="text-[#C9A84C]">Ctrl+P</strong> (или ⌘+P на Mac) — откроется диалог печати
            </li>
            <li>
              Выберите <strong>«Сохранить как PDF»</strong> вместо принтера
            </li>
            <li>Распечатайте PDF и подпишите каждый документ</li>
            <li>Принесите подписанные документы на пункт сбора</li>
          </ol>
          <p className="mt-1.5 text-[#666]">
            Можно также нажать «Печать всех» — документы откроются сразу в диалоге печати.
          </p>
        </div>
      </div>

      {/* Чек-лист подписания */}
      <DocumentChecklist />

      {/* Список отдельных документов */}
      <div className="space-y-2">
        {docs.map((doc, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#C9A84C]/5 border border-[#C9A84C]/15 hover:border-[#C9A84C]/30 transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={14} className="text-[#C9A84C] flex-shrink-0" />
              <span className="text-sm text-[#ccc] truncate">{doc.name}</span>
              {doc.uploaded_at && (
                <span className="text-xs text-[#555] flex-shrink-0">
                  {new Date(doc.uploaded_at).toLocaleDateString('ru-RU')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                title="Открыть"
                className="p-1.5 rounded text-[#888] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all"
              >
                <ExternalLink size={14} />
              </a>
              <a
                href={doc.url}
                download
                title="Скачать"
                className="p-1.5 rounded text-[#888] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all"
              >
                <Download size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { isImageUrl } from '@/lib/imageCompress';

/**
 * Inline-просмотрщик документов — открывается поверх страницы (overlay),
 * не в новом окне/вкладке. Поддерживает изображения и PDF.
 */
export default function DocumentLightbox({ docs, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + docs.length) % docs.length);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % docs.length);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [docs.length, onClose]);

  // Сброс зума при смене документа
  useEffect(() => {
    setZoomed(false);
  }, [index]);

  if (!docs?.length) return null;
  const doc = docs[index];
  if (!doc) return null;

  const isImg = isImageUrl(doc.url);
  const displayName = doc.name?.split(': ')[1] || doc.name || 'Документ';

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <span className="text-sm text-white/80 truncate max-w-[60%]">{displayName}</span>
        <div className="flex items-center gap-1">
          {isImg && (
            <button
              onClick={() => setZoomed((z) => !z)}
              title={zoomed ? 'Уменьшить' : 'Увеличить'}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
            </button>
          )}
          <a
            href={doc.url}
            download={displayName}
            title="Скачать"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Download size={18} />
          </a>
          <button
            onClick={onClose}
            title="Закрыть (Esc)"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Counter */}
      {docs.length > 1 && (
        <div className="text-center text-xs text-white/30 py-1.5 flex-shrink-0">
          {index + 1} / {docs.length}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4 relative">
        {isImg ? (
          <img
            src={doc.url}
            alt={displayName}
            onClick={() => setZoomed((z) => !z)}
            className={
              zoomed
                ? 'cursor-zoom-out max-w-none object-contain'
                : 'cursor-zoom-in max-w-full max-h-full object-contain'
            }
            style={zoomed ? { width: 'auto', height: 'auto' } : undefined}
          />
        ) : (
          <iframe
            src={doc.url}
            title={displayName}
            className="w-full h-full bg-white"
            style={{ minHeight: '70vh' }}
          />
        )}
      </div>

      {/* Navigation */}
      {docs.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + docs.length) % docs.length)}
            title="Предыдущий"
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/8 text-white/70 hover:text-white hover:bg-white/15 transition-all backdrop-blur-sm"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % docs.length)}
            title="Следующий"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/8 text-white/70 hover:text-white hover:bg-white/15 transition-all backdrop-blur-sm"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </div>
  );
}
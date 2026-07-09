import { useState } from 'react';
import { FileText, ExternalLink, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import DocumentLightbox from '@/components/candidate/DocumentLightbox';

/**
 * Быстрый предпросмотр ключевых документов (паспорт, прописка).
 * Показывает миниатюры изображений прямо в начале блока документов,
 * чтобы админ мог сразу увидеть паспорт и прописку без лишних кликов.
 */
export default function DocumentQuickPreview({ formDocs }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Ключевые документы для быстрого просмотра
  const PRIORITY = [
    { id: 'passport_main', label: 'Паспорт (фото)' },
    { id: 'passport_reg', label: 'Паспорт (прописка)' },
  ];

  // Находим загруженные документы по приоритету
  const previewDocs = PRIORITY
    .map(p => {
      const doc = formDocs.find(d => d.doc_type === p.id);
      return doc ? { ...doc, label: p.label } : null;
    })
    .filter(Boolean);

  // Также добавляем остальные загруженные изображения (не дублируя приоритетные)
  const otherImageDocs = formDocs.filter(d =>
    !PRIORITY.some(p => p.id === d.doc_type) &&
    d.url && d.url.match(/\.(jpg|jpeg|png|webp|gif|bmp)$/i)
  ).map(d => ({ ...d, label: d.name?.split(': ')[1] || d.name || 'Документ' }));

  const allPreviewDocs = [...previewDocs, ...otherImageDocs];
  const missingPriority = PRIORITY.filter(p => !formDocs.find(d => d.doc_type === p.id));

  if (allPreviewDocs.length === 0 && missingPriority.length === 0) return null;

  const isImageUrl = (url) => url && url.match(/\.(jpg|jpeg|png|webp|gif|bmp)$/i);

  return (
    <div className="mb-4 p-3 rounded-xl bg-[rgba(123,63,191,0.04)] border border-[rgba(123,63,191,0.15)]">
      <div className="flex items-center gap-1.5 mb-2">
        <ImageIcon size={12} className="text-[#7B3FBF]" />
        <span className="text-[10px] font-bold text-[#7B3FBF] uppercase tracking-wider">Быстрый просмотр</span>
      </div>

      {allPreviewDocs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allPreviewDocs.map((doc, idx) => {
            const isImage = isImageUrl(doc.url);
            return (
              <div key={doc.url + idx} className="group relative">
                <button
                  type="button"
                  onClick={() => isImage ? setLightboxIndex(idx) : window.open(doc.url, '_blank')}
                  className="block w-[100px] h-[72px] rounded-lg overflow-hidden border border-[rgba(123,63,191,0.2)] hover:border-[#7B3FBF] transition-all bg-[#05070A]"
                  title={doc.label}
                >
                  {isImage ? (
                    <img
                      src={doc.url}
                      alt={doc.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[#F8FAFC]/30">
                      <FileText size={18} />
                      <span className="text-[9px]">PDF/файл</span>
                    </div>
                  )}
                </button>
                <div className="text-center mt-1">
                  <div className="text-[9px] text-[#F8FAFC]/50 leading-tight truncate w-[100px]">{doc.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {missingPriority.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#F8FAFC]/30">
          <AlertTriangle size={10} className="text-[#F8FAFC]/30" />
          Не загружено: {missingPriority.map(p => p.label).join(', ')}
        </div>
      )}

      {lightboxIndex !== null && allPreviewDocs.length > 0 && (
        <DocumentLightbox
          docs={allPreviewDocs}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
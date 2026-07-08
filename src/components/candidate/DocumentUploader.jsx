import { useState } from 'react';
import { Upload, Loader2, Trash2, CheckCircle, AlertTriangle, FileText, Eye } from 'lucide-react';
import { isImageUrl } from '@/lib/imageCompress';

const ACCEPT = '.jpg,.jpeg,.png,.pdf,.heic,.heif,.webp,.bmp,.gif,.tiff';

function PreviewThumb({ url, onClick, size = 'w-12 h-12' }) {
  if (isImageUrl(url)) {
    return (
      <img
        src={url}
        onClick={onClick}
        alt="Документ"
        className={`${size} object-cover rounded cursor-pointer border border-[#333] hover:border-[#7B3FBF] transition-colors flex-shrink-0`}
      />
    );
  }
  return (
    <div
      onClick={onClick}
      className={`${size} flex items-center justify-center rounded cursor-pointer border border-[#333] bg-[#1a1a1a] hover:border-[#7B3FBF] transition-colors flex-shrink-0`}
    >
      <FileText size={18} className="text-[#666]" />
    </div>
  );
}

export default function DocumentUploader({
  docTypes,
  uploadedDocs,
  onUpload,
  onRemove,
  uploadingDocType,
  uploadErrors,
  onView,
}) {
  const [dragOver, setDragOver] = useState(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {docTypes.map((dt) => {
        const uploaded = uploadedDocs.find((d) => d.doc_type === dt.id);
        const isUploading = uploadingDocType === dt.id;
        const error = uploadErrors[dt.id];
        const isDragOver = dragOver === dt.id;

        return (
          <div
            key={dt.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(dt.id);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const file = e.dataTransfer.files?.[0];
              if (file) onUpload(dt.id, dt.label, file);
            }}
            className={`relative rounded-lg border-2 border-dashed p-3 transition-all ${
              isDragOver
                ? 'border-[#7B3FBF] bg-[#7B3FBF]/8'
                : uploaded
                  ? 'border-green-800/25 bg-green-900/5'
                  : 'border-[#333] bg-[#161616] hover:border-[#555]'
            }`}
          >
            {/* Label */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#aaa] font-medium leading-tight">
                {dt.label}
                {dt.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {uploaded && !isUploading && (
                <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
              )}
            </div>

            {/* Content */}
            {isUploading ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 size={14} className="animate-spin text-[#7B3FBF]" />
                <span className="text-xs text-[#888]">Загрузка...</span>
              </div>
            ) : uploaded ? (
              <div className="flex items-center gap-2">
                <PreviewThumb
                  url={uploaded.url}
                  onClick={() => onView && onView(uploaded)}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-green-500/80 truncate block leading-tight">
                    {uploaded.name?.split(': ')[1] || uploaded.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onView && onView(uploaded)}
                    title="Просмотр"
                    className="p-1.5 rounded border border-[#333] text-[#666] hover:text-[#7B3FBF] hover:border-[#7B3FBF]/40 transition-colors"
                  >
                    <Eye size={12} />
                  </button>
                  <label
                    title="Заменить"
                    className="p-1.5 rounded border border-[#333] text-[#666] hover:text-[#aaa] hover:border-[#555] transition-colors cursor-pointer"
                  >
                    <Upload size={12} />
                    <input
                      type="file"
                      className="hidden"
                      accept={ACCEPT}
                      onChange={(e) =>
                        e.target.files?.[0] && onUpload(dt.id, dt.label, e.target.files[0])
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemove(dt.id)}
                    title="Удалить"
                    className="p-1.5 rounded border border-[#333] text-[#666] hover:text-red-400 hover:border-red-500/30 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-4 cursor-pointer">
                <Upload size={18} className="text-[#444] mb-1" />
                <span className="text-xs text-[#555] text-center leading-tight">
                  Перетащите файл
                  <br />
                  или нажмите для выбора
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept={ACCEPT}
                  onChange={(e) =>
                    e.target.files?.[0] && onUpload(dt.id, dt.label, e.target.files[0])
                  }
                />
              </label>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-1.5 mt-1.5 pt-1.5 border-t border-red-900/20">
                <AlertTriangle size={11} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-red-400 leading-tight">{error}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
import { useState } from 'react';
import { Upload, Trash2, Download, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { uploadWithRetry, validateFile } from '@/lib/uploadWithRetry';
import { getDocTypesForCitizenship } from '@/lib/docUtils';
import DocumentQuickPreview from './DocumentQuickPreview';

export default function CandidateDocuments({ formDocs, setFormDocs, citizenship }) {
  const [uploadingDocType, setUploadingDocType] = useState(null);
  const [uploadErrors, setUploadErrors] = useState({});

  const docTypes = getDocTypesForCitizenship(citizenship);

  const handleDocUpload = async (docType, docLabel, file) => {
    if (!file) return;
    setUploadErrors(prev => ({ ...prev, [docType]: null }));
    const validationError = validateFile(file);
    if (validationError) { setUploadErrors(prev => ({ ...prev, [docType]: validationError })); return; }
    setUploadingDocType(docType);
    try {
      const file_url = await uploadWithRetry(file);
      const newDoc = { doc_type: docType, name: docLabel + ': ' + file.name, url: file_url, uploaded_at: new Date().toISOString() };
      setFormDocs(prev => {
        const filtered = prev.filter(d => d.doc_type !== docType);
        return [...filtered, newDoc];
      });
    } catch (e) {
      setUploadErrors(prev => ({ ...prev, [docType]: `Не удалось загрузить «${file.name}». Проверьте подключение.` }));
    }
    setUploadingDocType(null);
  };

  const removeDoc = (docType) => setFormDocs(prev => prev.filter(d => d.doc_type !== docType));

  return (
    <div className="border-t border-[rgba(123,63,191,0.15)] pt-4">
      <div className="text-xs text-[#7B3FBF] font-bold uppercase tracking-widest mb-1">
        Документы кандидата {formDocs.length > 0 && <span className="text-[#F8FAFC]/40 normal-case font-normal">({formDocs.length} загружено)</span>}
      </div>
      <p className="text-xs text-[#F8FAFC]/40 mb-3">
        Сохраняются в анкете. Обязательные поля отмечены <span className="text-red-400">*</span>
      </p>

      {formDocs.length > 0 && <DocumentQuickPreview formDocs={formDocs} />}
      <div className="space-y-2">
        {docTypes.map(dt => {
          const uploaded = formDocs.find(d => d.doc_type === dt.id);
          return (
            <div key={dt.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(123,63,191,0.12)] rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#F8FAFC]/80 font-medium">
                  {dt.label}{dt.required && <span className="text-red-400 ml-1">*</span>}
                </div>
                {uploaded && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <FileText size={12} className="text-green-400 flex-shrink-0" />
                    <span className="text-xs text-green-400 truncate">{uploaded.name.split(': ')[1] || uploaded.name}</span>
                  </div>
                )}
                {uploadErrors[dt.id] && (
                  <div className="flex items-start gap-1.5 mt-1">
                    <AlertTriangle size={11} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-red-400">{uploadErrors[dt.id]}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
                {uploadingDocType === dt.id ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#F8FAFC]/50">
                    <Loader2 size={12} className="animate-spin" /> Загрузка...
                  </div>
                ) : (
                  <>
                    {uploaded && (
                      <>
                        <a href={uploaded.url} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded hover:bg-[#7B3FBF]/20 text-[#F8FAFC]/50 hover:text-[#C9A84C] transition-all">
                          <Download size={13} />
                        </a>
                        <button type="button" onClick={() => removeDoc(dt.id)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-[#F8FAFC]/50 hover:text-red-400 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                    <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs cursor-pointer transition-all ${uploaded ? 'border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/50 hover:border-[#7B3FBF]/40' : 'border-[rgba(123,63,191,0.3)] text-[#7B3FBF] hover:bg-[rgba(123,63,191,0.1)]'}`}>
                      <Upload size={11} />
                      {uploaded ? 'Заменить' : 'Загрузить'}
                      <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf,.heic,.heif,.webp,.bmp,.gif,.tiff"
                        onChange={e => e.target.files?.[0] && handleDocUpload(dt.id, dt.label, e.target.files[0])} />
                    </label>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
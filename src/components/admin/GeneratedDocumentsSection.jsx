import { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink, RefreshCw, CheckCircle, Loader2, AlertCircle, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

/**
 * Секция сгенерированных документов в карточке кандидата.
 * Самостоятельно загружает candidate.documents и отображает документы с type === 'generated'.
 */
export default function GeneratedDocumentsSection({ candidateId, candidateName }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDocs = async (silent = false) => {
    if (!candidateId) return;
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const c = await base44.entities.Candidate.get(candidateId);
      if (c) {
        setDocs((c.documents || []).filter(d => d.type === 'generated'));
      }
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDocs();
    // Подписка на изменения кандидата — обновляем список документов в реальном времени
    const unsubscribe = base44.entities.Candidate.subscribe((event) => {
      if (event.data?.id !== candidateId) return;
      if (event.type === 'update' && event.data?.documents) {
        setDocs((event.data.documents || []).filter(d => d.type === 'generated'));
      }
    });
    return unsubscribe;
  }, [candidateId]);

  if (loading) return (
    <div className="border-t border-[rgba(201,168,76,0.15)] pt-4">
      <div className="flex items-center gap-2 text-xs text-[#F8FAFC]/30">
        <Loader2 size={12} className="animate-spin" /> Загрузка документов...
      </div>
    </div>
  );

  return (
    <div className="border-t border-[rgba(201,168,76,0.15)] pt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-[#C9A84C] font-bold uppercase tracking-widest flex items-center gap-2">
          <FileText size={13} />
          Сгенерированные документы
          {docs.length > 0 && <span className="text-green-400 normal-case font-normal">({docs.length})</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadDocs(true)} disabled={refreshing}
            className="p-1.5 rounded hover:bg-[#C9A84C]/10 text-[#F8FAFC]/40 hover:text-[#C9A84C] transition-all disabled:opacity-30">
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <Link to="/admin/documents" className="flex items-center gap-1 text-xs text-[#7B3FBF] hover:text-[#8B4FCF] transition-all">
            <Link2 size={11} /> Генератор
          </Link>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-[rgba(255,255,255,0.02)] border border-[rgba(123,63,191,0.1)] rounded-lg">
          <AlertCircle size={13} className="text-[#F8FAFC]/20 flex-shrink-0" />
          <span className="text-xs text-[#F8FAFC]/30">Документы ещё не сгенерированы</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {docs.map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-[#C9A84C]/5 border border-[#C9A84C]/15 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle size={13} className="text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-[#F8FAFC]/80 truncate">{doc.name}</div>
                  {doc.uploaded_at && (
                    <div className="text-[10px] text-[#F8FAFC]/30">{new Date(doc.uploaded_at).toLocaleString('ru-RU')}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a href={doc.url} target="_blank" rel="noreferrer" title="Открыть"
                  className="p-1.5 rounded hover:bg-[#C9A84C]/15 text-[#F8FAFC]/50 hover:text-[#C9A84C] transition-all">
                  <ExternalLink size={13} />
                </a>
                <a href={doc.url} download title="Скачать"
                  className="p-1.5 rounded hover:bg-[#7B3FBF]/15 text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-all">
                  <Download size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
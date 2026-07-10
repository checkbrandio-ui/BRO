import { useState, useEffect, useMemo } from 'react';
import { FileText, Shield, FileSignature, Lock, Printer, Search, Loader2, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DOCUMENT_TYPES = [
  { id: 'trudovoy_dogovor', label: 'Трудовой договор', icon: FileText, desc: 'Основной договор с должностными обязанностями' },
  { id: 'consent_pd', label: 'Согласие на ПД', icon: Shield, desc: 'Обработка персональных данных (152-ФЗ)' },
  { id: 'raspiska', label: 'Расписка-обязательство', icon: FileSignature, desc: 'Legal Shield: подтверждение и согласие' },
  { id: 'nda', label: 'Соглашение о неразглашении', icon: Lock, desc: 'NDA для режимных объектов' },
];

export default function DocumentGenerator() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [docType, setDocType] = useState('trudovoy_dogovor');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.Candidate.list('-created_date', 500)
      .then(cands => setCandidates(cands.filter(c => !c.deleted_at && !c.is_archived)))
      .catch(() => setError('Не удалось загрузить список кандидатов'));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return candidates;
    const q = search.toLowerCase();
    return candidates.filter(c =>
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.position || '').toLowerCase().includes(q)
    );
  }, [candidates, search]);

  const selectedCandidate = candidates.find(c => c.id === selectedId);

  const handleGenerate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    setPreview('');
    try {
      const res = await base44.functions.invoke('generateDocument', {
        candidate_id: selectedId,
        document_type: docType,
      });
      if (res.data?.error) {
        setError(res.data.error);
      } else if (res.data?.html) {
        setPreview(res.data.html);
      } else {
        setError('Пустой ответ от генератора');
      }
    } catch (e) {
      setError(e.message || 'Ошибка генерации документа');
    }
    setLoading(false);
  };

  const handlePrint = () => {
    const iframe = document.getElementById('doc-preview');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#05070A] p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#F8FAFC] heading-xl">Генератор документов</h1>
          <p className="text-sm text-[#F8FAFC]/40 mt-1">Выберите кандидата и тип документа — система автоматически подставит все данные</p>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Левая панель — выбор */}
          <div className="space-y-4">
            {/* Поиск кандидата */}
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="text-[#7B3FBF]" />
                <h3 className="text-sm font-bold text-[#F8FAFC]/80 uppercase tracking-widest">Кандидат</h3>
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по ФИО, телефону, должности..."
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/25 focus:outline-none focus:border-[#7B3FBF] transition-all mb-3"
              />
              <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                {filtered.length === 0 && (
                  <div className="text-center py-6 text-xs text-[#F8FAFC]/25">
                    {candidates.length === 0 ? 'Загрузка...' : 'Кандидаты не найдены'}
                  </div>
                )}
                {filtered.slice(0, 50).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                      selectedId === c.id
                        ? 'bg-[#7B3FBF]/20 border-[#7B3FBF]/50'
                        : 'bg-[rgba(255,255,255,0.02)] border-[rgba(123,63,191,0.1)] hover:border-[rgba(123,63,191,0.3)]'
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#F8FAFC]/90 truncate">{c.full_name || '—'}</div>
                    <div className="text-xs text-[#F8FAFC]/35 flex items-center gap-2 mt-0.5">
                      <span>{c.position || '—'}</span>
                      {c.phone && <span>· {c.phone}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Выбор типа документа */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-bold text-[#F8FAFC]/80 uppercase tracking-widest mb-3">Тип документа</h3>
              <div className="space-y-2">
                {DOCUMENT_TYPES.map(dt => {
                  const Icon = dt.icon;
                  const isActive = docType === dt.id;
                  return (
                    <button
                      key={dt.id}
                      onClick={() => setDocType(dt.id)}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                        isActive
                          ? 'bg-[#7B3FBF]/15 border-[#7B3FBF]/40'
                          : 'bg-[rgba(255,255,255,0.02)] border-[rgba(123,63,191,0.1)] hover:border-[rgba(123,63,191,0.25)]'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-[#C9A84C]' : 'text-[#F8FAFC]/30'} />
                      <div>
                        <div className={`text-sm font-semibold ${isActive ? 'text-[#F8FAFC]' : 'text-[#F8FAFC]/70'}`}>{dt.label}</div>
                        <div className="text-xs text-[#F8FAFC]/30 mt-0.5">{dt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Кнопка генерации */}
            <button
              onClick={handleGenerate}
              disabled={!selectedId || loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm rounded-xl bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-purple"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Генерация...</span>
                </>
              ) : (
                <>
                  <FileText size={16} />
                  <span>Сгенерировать</span>
                </>
              )}
            </button>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Правая панель — превью */}
          <div className="glass-card rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '700px' }}>
            {preview ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(123,63,191,0.15)]">
                  <div className="text-sm font-semibold text-[#F8FAFC]/80">
                    {DOCUMENT_TYPES.find(d => d.id === docType)?.label}
                    {selectedCandidate && <span className="text-[#F8FAFC]/30 ml-2">· {selectedCandidate.full_name}</span>}
                  </div>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-all font-semibold"
                  >
                    <Printer size={14} />
                    Печать / PDF
                  </button>
                </div>
                <iframe
                  id="doc-preview"
                  srcDoc={preview}
                  className="w-full flex-1 bg-white"
                  style={{ minHeight: '650px' }}
                  title="Предпросмотр документа"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <FileText size={48} className="text-[#7B3FBF]/20 mb-4" />
                <p className="text-sm text-[#F8FAFC]/30">
                  {selectedId ? 'Нажмите «Сгенерировать» для предпросмотра' : 'Выберите кандидата и тип документа'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
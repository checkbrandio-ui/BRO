import { useState, useEffect, useMemo } from 'react';
import { FileText, Shield, FileSignature, Lock, Printer, Search, Loader2, Layers, Briefcase, AlertCircle, ChevronLeft, ChevronRight, FileCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DOCUMENT_TYPES = [
  { id: 'razdel0', label: 'Раздел 0. Протокол приоритета', icon: Layers, desc: 'Иерархия документов: PRIMARY над SECONDARY', pkg: 'cover' },
  { id: 'trudovoy_dogovor', label: 'Трудовой договор', icon: FileText, desc: 'PRIMARY — основной договор с обязанностями', pkg: 'a' },
  { id: 'zayavlenie', label: 'Заявление о приёме', icon: FileCheck, desc: 'Заявление на работу', pkg: 'a' },
  { id: 'dolzhnostnaya_instrukciya', label: 'Должностная инструкция', icon: Briefcase, desc: 'По должности: обязанности, права, ответственность', pkg: 'a' },
  { id: 'consent_pd', label: 'Согласие на ПД', icon: Shield, desc: 'Обработка персональных данных (152-ФЗ)', pkg: 'a' },
  { id: 'soglasie_vahta', label: 'Согласие на вахту', icon: FileCheck, desc: 'Вахтовый метод работы', pkg: 'a' },
  { id: 'raspiska', label: 'Расписка-обязательство', icon: FileSignature, desc: 'Legal Shield: подтверждение и согласие', pkg: 'b' },
  { id: 'nda', label: 'Соглашение о неразглашении', icon: Lock, desc: 'NDA для режимных объектов', pkg: 'b' },
  { id: 'materialnaya_otvetstvennost', label: 'Мат. ответственность', icon: Shield, desc: 'Полная индивидуальная', pkg: 'b' },
  { id: 'instruktazh_tb', label: 'Инструктаж по ТБ', icon: AlertCircle, desc: 'Охрана труда и техника безопасности', pkg: 'b' },
  { id: 'soglasie_regim', label: 'Согласие на режим', icon: Lock, desc: 'Режимные ограничения объекта', pkg: 'b' },
  { id: 'akt_peredachi', label: 'Акт приёма-передачи', icon: FileText, desc: 'Подтверждение получения пакета', pkg: 'b' },
];

const PACKAGES = [
  { id: 'all', label: 'Полный пакет', desc: 'Все 12 документов + Раздел 0' },
  { id: 'a', label: 'Пакет А (Штат)', desc: 'Трудовой + Заявление + Инструкция + ПД + Вахта' },
  { id: 'b', label: 'Пакет Б (Объект)', desc: 'Расписка + NDA + Мат.отв. + ТБ + Режим + Акт' },
];

export default function DocumentGenerator() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [docType, setDocType] = useState('trudovoy_dogovor');
  const [mode, setMode] = useState('single'); // 'single' | 'package'
  const [packageType, setPackageType] = useState('all');
  const [preview, setPreview] = useState('');
  const [packageDocs, setPackageDocs] = useState([]);
  const [activeDocIdx, setActiveDocIdx] = useState(0);
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
    setPackageDocs([]);
    try {
      const payload = { candidate_id: selectedId };
      if (mode === 'package') {
        payload.package = packageType;
      } else {
        payload.document_type = docType;
      }
      const res = await base44.functions.invoke('generateDocument', payload);
      if (res.data?.error) {
        setError(res.data.error);
      } else if (res.data?.documents) {
        setPackageDocs(res.data.documents);
        setActiveDocIdx(0);
        setPreview(res.data.documents[0]?.html || '');
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

  const switchDoc = (idx) => {
    setActiveDocIdx(idx);
    setPreview(packageDocs[idx]?.html || '');
  };

  const hasMissingData = selectedCandidate && (!selectedCandidate.form_status || selectedCandidate.form_status !== 'completed');

  return (
    <div className="min-h-screen bg-[#05070A] p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#F8FAFC] heading-xl">Генератор документов</h1>
          <p className="text-sm text-[#F8FAFC]/40 mt-1">Полный пакет: Раздел 0 + Пакет А (Штат) + Пакет Б (Объект). 12 шаблонов с авто-подстановкой данных.</p>
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
              <div className="max-h-[260px] overflow-y-auto space-y-1.5">
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
                      {c.form_status === 'completed'
                        ? <span className="text-green-400 ml-auto">✓ Анкета</span>
                        : <span className="text-[#C9A84C] ml-auto">Анкета не заполнена</span>}
                    </div>
                  </button>
                ))}
              </div>
              {hasMissingData && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-[#C9A84C]/8 border border-[#C9A84C]/20 text-xs text-[#C9A84C]/70 flex items-start gap-2">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <span>Анкета не заполнена — паспортные данные и адрес могут быть пустыми в документах.</span>
                </div>
              )}
            </div>

            {/* Режим генерации */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-bold text-[#F8FAFC]/80 uppercase tracking-widest mb-3">Режим</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setMode('single')}
                  className={`px-3 py-2 text-xs rounded-lg border transition-all font-semibold ${
                    mode === 'single'
                      ? 'bg-[#7B3FBF]/20 border-[#7B3FBF]/50 text-[#F8FAFC]'
                      : 'border-[rgba(123,63,191,0.1)] text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70'
                  }`}
                >
                  Один документ
                </button>
                <button
                  onClick={() => setMode('package')}
                  className={`px-3 py-2 text-xs rounded-lg border transition-all font-semibold ${
                    mode === 'package'
                      ? 'bg-[#7B3FBF]/20 border-[#7B3FBF]/50 text-[#F8FAFC]'
                      : 'border-[rgba(123,63,191,0.1)] text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70'
                  }`}
                >
                  Пакет документов
                </button>
              </div>

              {mode === 'single' ? (
                <div className="space-y-2">
                  {DOCUMENT_TYPES.map(dt => {
                    const Icon = dt.icon;
                    const isActive = docType === dt.id;
                    const pkgColor = dt.pkg === 'cover' ? 'text-[#C9A84C]' : dt.pkg === 'a' ? 'text-[#7B3FBF]' : 'text-red-400';
                    return (
                      <button
                        key={dt.id}
                        onClick={() => setDocType(dt.id)}
                        className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg border transition-all text-left ${
                          isActive
                            ? 'bg-[#7B3FBF]/15 border-[#7B3FBF]/40'
                            : 'bg-[rgba(255,255,255,0.02)] border-[rgba(123,63,191,0.08)] hover:border-[rgba(123,63,191,0.2)]'
                        }`}
                      >
                        <Icon size={14} className={isActive ? 'text-[#C9A84C]' : 'text-[#F8FAFC]/25'} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-semibold truncate ${isActive ? 'text-[#F8FAFC]' : 'text-[#F8FAFC]/60'}`}>{dt.label}</div>
                          <div className="text-[10px] text-[#F8FAFC]/25 truncate">{dt.desc}</div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase ${pkgColor} flex-shrink-0`}>{dt.pkg === 'cover' ? '0' : dt.pkg}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {PACKAGES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPackageType(p.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                        packageType === p.id
                          ? 'bg-[#7B3FBF]/15 border-[#7B3FBF]/40'
                          : 'bg-[rgba(255,255,255,0.02)] border-[rgba(123,63,191,0.08)] hover:border-[rgba(123,63,191,0.2)]'
                      }`}
                    >
                      <div className={`text-sm font-bold ${packageType === p.id ? 'text-[#F8FAFC]' : 'text-[#F8FAFC]/60'}`}>{p.label}</div>
                      <div className="text-xs text-[#F8FAFC]/30 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              )}
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
                  <span>{mode === 'package' ? 'Сгенерировать пакет' : 'Сгенерировать'}</span>
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
                  <div className="flex items-center gap-3 min-w-0">
                    {packageDocs.length > 1 && (
                      <>
                        <button
                          onClick={() => switchDoc(Math.max(0, activeDocIdx - 1))}
                          disabled={activeDocIdx === 0}
                          className="p-1 rounded hover:bg-[#7B3FBF]/20 text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-all disabled:opacity-20"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs text-[#F8FAFC]/40 whitespace-nowrap">
                          {activeDocIdx + 1} / {packageDocs.length}
                        </span>
                        <button
                          onClick={() => switchDoc(Math.min(packageDocs.length - 1, activeDocIdx + 1))}
                          disabled={activeDocIdx === packageDocs.length - 1}
                          className="p-1 rounded hover:bg-[#7B3FBF]/20 text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-all disabled:opacity-20"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}
                    <div className="text-sm font-semibold text-[#F8FAFC]/80 truncate">
                      {packageDocs.length > 0 ? packageDocs[activeDocIdx]?.title : DOCUMENT_TYPES.find(d => d.id === docType)?.label}
                      {selectedCandidate && <span className="text-[#F8FAFC]/30 ml-2">· {selectedCandidate.full_name}</span>}
                    </div>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-all font-semibold whitespace-nowrap"
                  >
                    <Printer size={14} />
                    Печать / PDF
                  </button>
                </div>

                {/* Навигация по пакету */}
                {packageDocs.length > 1 && (
                  <div className="flex gap-1 px-4 py-2 border-b border-[rgba(123,63,191,0.1)] overflow-x-auto">
                    {packageDocs.map((doc, idx) => (
                      <button
                        key={idx}
                        onClick={() => switchDoc(idx)}
                        className={`px-3 py-1.5 text-xs rounded-lg border whitespace-nowrap transition-all ${
                          idx === activeDocIdx
                            ? 'bg-[#7B3FBF]/20 border-[#7B3FBF]/40 text-[#F8FAFC]'
                            : 'border-[rgba(123,63,191,0.1)] text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70'
                        }`}
                      >
                        {idx + 1}. {doc.title}
                      </button>
                    ))}
                  </div>
                )}

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
                {mode === 'package' && (
                  <p className="text-xs text-[#F8FAFC]/20 mt-2">
                    Полный пакет содержит 12 документов с навигацией и печатью каждого
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useRef } from 'react';
import { X, FileText, Loader2, CheckCircle, AlertCircle, RotateCw, Download, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PACKAGES = [
  { id: 'all', label: 'Полный пакет (14 документов)', desc: 'Раздел 0 + Пакет А + Пакет Б' },
  { id: 'a', label: 'Пакет А — Штат', desc: 'Трудовой + Заявление + Инструкция + ПД + Вахта' },
  { id: 'b', label: 'Пакет Б — Объект', desc: 'Расписка + NDA + Мат.отв. + ТБ + Режим + Акт' },
];

const CHUNK_SIZE = 4;

export default function BulkDocumentGenerator({ candidates, onClose, onComplete }) {
  const [packageType, setPackageType] = useState('all');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const stopRef = useRef(false);

  const processOne = async (c) => {
    const res = await base44.functions.invoke('generateDocument', {
      candidate_id: c.id,
      package: packageType,
      save_and_notify: true,
      origin: window.location.origin,
    });
    if (res.data?.error) throw new Error(res.data.error);
    if (!res.data?.saved) throw new Error('Документ не сохранён');
    if (res.data.notify_errors?.length > 0) {
      console.warn(`Notify errors for ${c.full_name}:`, res.data.notify_errors);
    }
    return { candidate: c, documents: res.data.documents };
  };

  const start = async () => {
    setRunning(true);
    stopRef.current = false;
    const total = candidates.length;
    const state = { total, done: 0, errors: [], docs: {}, currentIds: null };
    setResults({ ...state });

    for (let i = 0; i < candidates.length; i += CHUNK_SIZE) {
      if (stopRef.current) break;
      const chunk = candidates.slice(i, i + CHUNK_SIZE);
      state.currentIds = chunk.map(c => c.id);
      setResults({ ...state });

      const settled = await Promise.allSettled(chunk.map(c => processOne(c)));

      settled.forEach((r, idx) => {
        const c = chunk[idx];
        if (r.status === 'fulfilled') {
          state.docs[c.id] = r.value;
        } else {
          state.errors.push({ candidate: c, error: r.reason?.message || 'Ошибка сети' });
        }
        state.done++;
      });
      setResults({ ...state });
    }

    state.currentIds = null;
    setRunning(false);
    setResults({ ...state });
    if (onComplete && Object.keys(state.docs).length > 0) {
      onComplete(Object.keys(state.docs));
    }
  };

  const stop = () => { stopRef.current = true; };

  const retryCandidate = async (entry) => {
    setRunning(true);
    setResults(prev => {
      const next = { ...prev };
      next.errors = next.errors.filter(e => e.candidate.id !== entry.candidate.id);
      return next;
    });
    try {
      const result = await processOne(entry.candidate);
      setResults(prev => {
        const next = { ...prev };
        next.docs[entry.candidate.id] = result;
        next.done = next.total;
        return next;
      });
    } catch (e) {
      setResults(prev => ({ ...prev, errors: [...prev.errors, { candidate: entry.candidate, error: e.message }] }));
    }
    setRunning(false);
  };

  const downloadHTML = (candName, docs) => {
    const combined = docs.map(d => `<!-- ${d.title} -->\n${d.html}`).join('\n\n<hr style="page-break-after:always;">\n\n');
    const blob = new Blob([combined], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents_${(candName || 'candidate').replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    if (!results?.docs) return;
    Object.values(results.docs).forEach(({ candidate, documents }) => {
      downloadHTML(candidate.full_name, documents);
    });
  };

  const progress = results ? Math.round((results.done / results.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(123,63,191,0.2)]">
          <div className="flex items-center gap-3">
            <Package size={20} className="text-[#C9A84C]" />
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC]">Пакетная генерация документов</h2>
              <p className="text-xs text-[#F8FAFC]/40">Выбрано кандидатов: {candidates.length} · параллельно по {CHUNK_SIZE}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-[#F8FAFC]/50 hover:text-[#F8FAFC] transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {!results && (
            <>
              <div>
                <h3 className="text-sm font-bold text-[#F8FAFC]/80 uppercase tracking-widest mb-3">Выберите пакет</h3>
                <div className="space-y-2">
                  {PACKAGES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPackageType(p.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        packageType === p.id
                          ? 'bg-[#7B3FBF]/15 border-[#7B3FBF]/50'
                          : 'border-[rgba(123,63,191,0.1)] hover:border-[rgba(123,63,191,0.3)]'
                      }`}
                    >
                      <div className={`text-sm font-bold ${packageType === p.id ? 'text-[#F8FAFC]' : 'text-[#F8FAFC]/60'}`}>{p.label}</div>
                      <div className="text-xs text-[#F8FAFC]/30 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-4 py-3 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/20 text-xs text-[#C9A84C]/70 flex items-start gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>Генерация идёт параллельно по {CHUNK_SIZE} кандидата. Документы сохраняются прямо в анкеты, кандидат получает email. Ошибки показываются сразу — можно повторить.</span>
              </div>
            </>
          )}

          {results && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#F8FAFC]">
                    {running ? 'Генерация...' : 'Завершено'}
                  </span>
                  <span className="text-sm text-[#F8FAFC]/50">{results.done} / {results.total}</span>
                </div>
                <div className="h-3 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${results.errors.length > 0 ? 'bg-gradient-to-r from-[#7B3FBF] to-[#C9A84C]' : 'bg-[#7B3FBF]'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-400 flex items-center gap-1"><CheckCircle size={12}/> Успешно: {Object.keys(results.docs).length}</span>
                  <span className="text-red-400 flex items-center gap-1"><AlertCircle size={12}/> Ошибок: {results.errors.length}</span>
                </div>
              </div>

              {running && results.currentIds && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#7B3FBF]/10 border border-[#7B3FBF]/20 text-xs text-[#F8FAFC]/60">
                  <Loader2 size={13} className="animate-spin text-[#7B3FBF]" />
                  <span>Генерация для: <strong className="text-[#F8FAFC]">{candidates.filter(c => results.currentIds.includes(c.id)).map(c => c.full_name).join(', ')}</strong></span>
                </div>
              )}

              {Object.keys(results.docs).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">Сгенерировано</h4>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {Object.values(results.docs).map(({ candidate, documents }) => (
                      <div key={candidate.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/15">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                          <span className="text-sm text-[#F8FAFC]/80 truncate">{candidate.full_name}</span>
                          <span className="text-xs text-[#F8FAFC]/30 flex-shrink-0">({documents.length} док.)</span>
                        </div>
                        <button
                          onClick={() => downloadHTML(candidate.full_name, documents)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-all whitespace-nowrap"
                        >
                          <Download size={11}/> Скачать
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.errors.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Ошибки ({results.errors.length})</h4>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {results.errors.map((e, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-red-300 font-semibold truncate">{e.candidate.full_name}</div>
                          <div className="text-xs text-red-400/70 mt-0.5">{e.error}</div>
                        </div>
                        <button
                          onClick={() => retryCandidate(e)}
                          disabled={running}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 transition-all disabled:opacity-40 whitespace-nowrap"
                        >
                          <RotateCw size={11}/> Повторить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[rgba(123,63,191,0.2)]">
          {results && !running && results.errors.length > 0 && (
            <span className="text-xs text-red-400/70">Часть документов не сгенерировано — нажмите «Повторить»</span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {results && !running && Object.keys(results.docs).length > 1 && (
              <button
                onClick={downloadAll}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-all font-semibold"
              >
                <Download size={15}/> Скачать все ({Object.keys(results.docs).length})
              </button>
            )}
            {!results && (
              <button
                onClick={start}
                disabled={candidates.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 text-sm rounded-xl bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] disabled:opacity-40 transition-all font-bold glow-purple"
              >
                <FileText size={16}/> Начать генерацию
              </button>
            )}
            {running && (
              <button
                onClick={stop}
                className="flex items-center gap-2 px-6 py-2.5 text-sm rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all font-bold"
              >
                <X size={16}/> Остановить
              </button>
            )}
            {results && !running && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 text-sm rounded-xl bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] transition-all font-bold"
              >
                Готово
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
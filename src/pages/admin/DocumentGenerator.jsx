import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, FileSignature, Lock, Printer, Search, Loader2, Layers, Briefcase, AlertCircle, ChevronLeft, ChevronRight, FileCheck, ArrowLeft, Save, CheckCircle, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DOCUMENT_TYPES = [
  { id: 'razdel0', label: 'Раздел 0. Протокол приоритета', icon: Layers, desc: 'Иерархия документов: PRIMARY над SECONDARY', pkg: 'cover' },
  { id: 'trudovoy_dogovor', label: 'Трудовой договор', icon: FileText, desc: 'PRIMARY — основной договор с обязанностями', pkg: 'a' },
  { id: 'zayavlenie', label: 'Заявление о приёме', icon: FileCheck, desc: 'Заявление на работу', pkg: 'a' },
  { id: 'dolzhnostnaya_instrukciya', label: 'Должностная инструкция', icon: Briefcase, desc: 'По должности: обязанности, права, ответственность', pkg: 'a' },
  { id: 'consent_pd', label: 'Согласие на ПД', icon: Shield, desc: 'Обработка персональных данных (152-ФЗ)', pkg: 'a' },
  { id: 'soglasie_vahta', label: 'Согласие на вахту', icon: FileCheck, desc: 'Вахтовый метод работы', pkg: 'a' },
  { id: 'raspiska', label: 'Расписка-обязательство', icon: FileSignature, desc: 'Legal Shield: подтверждение и согласие', pkg: 'b' },
  { id: 'nda', label: 'Безопасность и проф. этика', icon: Lock, desc: 'NDA в заботливом тоне: защита работника и коллег', pkg: 'b' },
  { id: 'materialnaya_otvetstvennost', label: 'Мат. ответственность', icon: Shield, desc: 'Полная индивидуальная', pkg: 'b' },
  { id: 'instruktazh_tb', label: 'Инструктаж по ТБ', icon: AlertCircle, desc: 'Охрана труда и техника безопасности', pkg: 'b' },
  { id: 'soglasie_regim', label: 'Согласие на режим', icon: Lock, desc: 'Режимные ограничения объекта', pkg: 'b' },
  { id: 'protokol_dopuska', label: 'Протокол допуска', icon: Layers, desc: 'Плавный подвод к МО: «ключ» от объекта', pkg: 'b' },
  { id: 'soglasie_soprovozhdenie', label: 'Согласие на сопровождение', icon: FileSignature, desc: 'Доверенность на оформление допусков от имени работника', pkg: 'b' },
  { id: 'akt_peredachi', label: 'Акт приёма-передачи', icon: FileText, desc: 'Подтверждение получения пакета (14 документов)', pkg: 'b' },
];

const PACKAGES = [
  { id: 'all', label: 'Полный пакет', desc: 'Все 14 документов + Раздел 0' },
  { id: 'a', label: 'Пакет А (Штат)', desc: 'Трудовой + Заявление + Инструкция + ПД + Вахта' },
  { id: 'b', label: 'Пакет Б (Объект)', desc: 'Расписка + NDA + Мат.отв. + ТБ + Режим + Акт' },
];

const POSITIONS = ['Разнорабочий','Строитель','Водитель B','Водитель C','Водитель CE','Водитель D','Автослесарь','Медицинский работник','Охранник'];

export default function DocumentGenerator() {
  const [candidates, setCandidates] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [previewId, setPreviewId] = useState(null);
  const [filters, setFilters] = useState({ position: '', agency: '', sb_check: '', form_status: '' });
  const [docType, setDocType] = useState('trudovoy_dogovor');
  const [mode, setMode] = useState('single');
  const [packageType, setPackageType] = useState('all');
  const [preview, setPreview] = useState('');
  const [packageDocs, setPackageDocs] = useState([]);
  const [activeDocIdx, setActiveDocIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.Candidate.list('-created_date', 500),
      base44.entities.Agency.list('-created_date', 200),
    ]).then(([cands, ags]) => {
      setCandidates(cands.filter(c => !c.deleted_at && !c.is_archived));
      setAgencies(ags.filter(a => !a.deleted_at));
    }).catch(() => setError('Не удалось загрузить данные'));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return candidates.filter(c => {
      const matchSearch = !q || (c.full_name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.position || '').toLowerCase().includes(q);
      const matchPos = !filters.position || c.position === filters.position;
      const matchAgency = !filters.agency || c.agency_id === filters.agency;
      const matchSb = !filters.sb_check || c.sb_check === filters.sb_check;
      const matchForm = !filters.form_status || c.form_status === filters.form_status;
      return matchSearch && matchPos && matchAgency && matchSb && matchForm;
    });
  }, [candidates, search, filters]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const allSelected = filtered.length > 0 && filtered.every(c => prev.has(c.id));
      if (allSelected) {
        const next = new Set(prev);
        filtered.forEach(c => next.delete(c.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach(c => next.add(c.id));
      return next;
    });
  };

  const previewCandidate = candidates.find(c => c.id === previewId);
  const isAllFilteredSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id));

  const handleGenerate = async () => {
    if (!previewId) return;
    setLoading(true);
    setError('');
    setPreview('');
    setPackageDocs([]);
    try {
      const payload = { candidate_id: previewId };
      if (mode === 'package') payload.package = packageType;
      else payload.document_type = docType;
      const res = await base44.functions.invoke('generateDocument', payload);
      if (res.data?.error) setError(res.data.error);
      else if (res.data?.documents) {
        setPackageDocs(res.data.documents);
        setActiveDocIdx(0);
        setPreview(res.data.documents[0]?.html || '');
      } else if (res.data?.html) setPreview(res.data.html);
      else setError('Пустой ответ от генератора');
    } catch (e) {
      setError(e.message || 'Ошибка генерации документа');
    }
    setLoading(false);
  };

  const handleSaveToCandidates = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setSaving(true);
    setError('');
    setSuccess('');
    setSaveProgress({ done: 0, total: ids.length, errors: 0 });
    let done = 0, errors = 0;
    for (const id of ids) {
      try {
        const payload = { candidate_id: id };
        if (mode === 'package') payload.package = packageType;
        else payload.document_type = docType;
        const res = await base44.functions.invoke('generateDocument', payload);
        if (res.data?.error) { errors++; done++; setSaveProgress({ done, total: ids.length, errors }); continue; }
        const docs = res.data?.documents || (res.data?.html ? [{ title: DOCUMENT_TYPES.find(d => d.id === docType)?.label || 'Документ', html: res.data.html }] : []);
        if (!docs.length) { errors++; done++; setSaveProgress({ done, total: ids.length, errors }); continue; }
        const combined = docs.map(d => `<!-- ${d.title} -->\n${d.html}`).join('\n\n<hr style="page-break-after:always;">\n\n');
        const blob = new Blob([combined], { type: 'text/html;charset=utf-8' });
        const file = new File([blob], mode === 'package' ? 'documents.html' : `${docType}.html`, { type: 'text/html' });
        const uploadRes = await base44.integrations.Core.UploadFile({ file });
        const file_url = uploadRes.file_url;
        const cand = candidates.find(c => c.id === id);
        const existingDocs = cand?.documents || [];
        const filteredDocs = existingDocs.filter(d => d.type !== 'generated');
        const docName = mode === 'package' ? 'Полный пакет документов' : (DOCUMENT_TYPES.find(d => d.id === docType)?.label || 'Документ');
        await base44.entities.Candidate.update(id, {
          documents: [...filteredDocs, { name: docName, url: file_url, type: 'generated', uploaded_at: new Date().toISOString() }],
        });
        // Уведомление в систему
        try {
          await base44.entities.Notification.create({
            candidate_id: id,
            candidate_name: cand?.full_name || '',
            agency_id: cand?.agency_id || '',
            agency_name: cand?.agency_name || '',
            message: `Сгенерирован документ: ${docName}`,
            link: '/admin/candidates',
            is_read: false,
            category: 'documents',
            actor_name: 'Администратор',
            actor_role: 'admin',
          });
        } catch (_) {}
        // Email-уведомление кандидату
        if (cand?.email) {
          try {
            await base44.integrations.Core.SendEmail({
              to: cand.email,
              subject: 'Ваши документы готовы — БРО-СНБ',
              body: `Здравствуйте, ${cand.full_name}!\n\nВаш пакет документов сгенерирован и доступен в вашей анкете.\n\nДля просмотра и печати:\n1. Откройте вашу анкету по ссылке: ${window.location.origin}/anketa-kandidata/${cand.form_token || ''}\n2. Найдите раздел «Ваш пакет документов готов»\n3. Нажмите «Открыть» → Ctrl+P для печати\n4. Распечатайте все страницы и подпишите\n5. Принесите подписанные документы на пункт сбора\n\nС уважением,\nООО «Братоуверие-СНБ»`,
              from_name: 'БРО-СНБ',
            });
          } catch (_) {}
        }
        done++;
        setSaveProgress({ done, total: ids.length, errors });
      } catch (e) {
        errors++; done++;
        setSaveProgress({ done, total: ids.length, errors });
      }
    }
    setSaving(false);
    setSuccess(`Сохранено: ${done - errors} из ${ids.length}${errors > 0 ? `, ошибок: ${errors}` : ''}`);
    // Обновляем локальный список кандидатов с новыми документами
    setCandidates(prev => prev.map(c => selectedIds.has(c.id)
      ? { ...c, documents: [...(c.documents || []).filter(d => d.type !== 'generated'), { name: mode === 'package' ? 'Полный пакет документов' : (DOCUMENT_TYPES.find(d => d.id === docType)?.label || 'Документ'), url: '', type: 'generated', uploaded_at: new Date().toISOString() }] }
      : c));
  };

  const handlePrint = () => {
    const iframe = document.getElementById('doc-preview');
    if (iframe && iframe.contentWindow) { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
  };

  const switchDoc = (idx) => { setActiveDocIdx(idx); setPreview(packageDocs[idx]?.html || ''); };

  const hasMissingData = previewCandidate && (!previewCandidate.form_status || previewCandidate.form_status !== 'completed');
  const inp = "w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#7B3FBF] transition-all";

  return (
    <div className="min-h-screen bg-[#05070A] p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link to="/admin/candidates" className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-[rgba(123,63,191,0.2)] text-[#F8FAFC]/60 hover:text-[#F8FAFC] hover:border-[#7B3FBF]/40 transition-all flex-shrink-0">
            <ArrowLeft size={16} /> Назад
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-[#F8FAFC] heading-xl">Генератор документов</h1>
            <p className="text-sm text-[#F8FAFC]/40 mt-1">Выберите кандидатов, сгенерируйте и сохраните документы прямо в их анкеты.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Left panel */}
          <div className="space-y-4">
            {/* Filters */}
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="text-[#7B3FBF]" />
                <h3 className="text-sm font-bold text-[#F8FAFC]/80 uppercase tracking-widest">Фильтры</h3>
              </div>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по ФИО, телефону..." className={inp + ' mb-3'} />
              <div className="grid grid-cols-2 gap-2">
                <select value={filters.position} onChange={e => setFilters(f => ({ ...f, position: e.target.value }))} className={inp}>
                  <option value="">Все должности</option>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={filters.agency} onChange={e => setFilters(f => ({ ...f, agency: e.target.value }))} className={inp}>
                  <option value="">Все агентства</option>
                  {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select value={filters.sb_check} onChange={e => setFilters(f => ({ ...f, sb_check: e.target.value }))} className={inp}>
                  <option value="">СБ: все</option>
                  <option>Не проверялся</option><option>На проверке</option><option>Согласован</option><option>Не согласован</option>
                </select>
                <select value={filters.form_status} onChange={e => setFilters(f => ({ ...f, form_status: e.target.value }))} className={inp}>
                  <option value="">Анкета: все</option>
                  <option value="completed">Заполнена</option>
                  <option value="pending">Не заполнена</option>
                </select>
              </div>
            </div>

            {/* Candidate list */}
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[#F8FAFC]/80 uppercase tracking-widest">Кандидаты</h3>
                <button onClick={toggleSelectAll} className="text-xs text-[#7B3FBF] hover:text-[#8B4FCF] transition-all">
                  {isAllFilteredSelected ? 'Снять все' : 'Выбрать все'}
                </button>
              </div>
              <div className="text-xs text-[#F8FAFC]/30 mb-2">Выбрано: {selectedIds.size} · Показано: {filtered.length}</div>
              <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                {filtered.length === 0 && <div className="text-center py-6 text-xs text-[#F8FAFC]/25">Кандидаты не найдены</div>}
                {filtered.slice(0, 80).map(c => (
                  <div key={c.id} onClick={() => toggleSelect(c.id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${selectedIds.has(c.id) ? 'bg-[#7B3FBF]/15 border-[#7B3FBF]/40' : 'bg-[rgba(255,255,255,0.02)] border-[rgba(123,63,191,0.08)] hover:border-[rgba(123,63,191,0.2)]'}`}>
                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => {}} className="w-4 h-4 rounded border-[rgba(123,63,191,0.3)] bg-transparent accent-[#7B3FBF] cursor-pointer" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#F8FAFC]/90 truncate">{c.full_name || '—'}</div>
                      <div className="text-xs text-[#F8FAFC]/35 flex items-center gap-2">
                        <span>{c.position || '—'}</span>
                        {c.form_status === 'completed' ? <span className="text-green-400">✓</span> : <span className="text-[#C9A84C]">нет анкеты</span>}
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setPreviewId(c.id); }} className={`text-xs px-2 py-1 rounded transition-all whitespace-nowrap ${previewId === c.id ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'text-[#F8FAFC]/30 hover:text-[#7B3FBF]'}`}>
                      Превью
                    </button>
                  </div>
                ))}
              </div>
              {hasMissingData && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-[#C9A84C]/8 border border-[#C9A84C]/20 text-xs text-[#C9A84C]/70 flex items-start gap-2">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <span>У кандидата для превью не заполнена анкета — паспортные данные могут быть пустыми.</span>
                </div>
              )}
            </div>

            {/* Mode selection */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-bold text-[#F8FAFC]/80 uppercase tracking-widest mb-3">Режим</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => setMode('single')} className={`px-3 py-2 text-xs rounded-lg border transition-all font-semibold ${mode === 'single' ? 'bg-[#7B3FBF]/20 border-[#7B3FBF]/50 text-[#F8FAFC]' : 'border-[rgba(123,63,191,0.1)] text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70'}`}>Один документ</button>
                <button onClick={() => setMode('package')} className={`px-3 py-2 text-xs rounded-lg border transition-all font-semibold ${mode === 'package' ? 'bg-[#7B3FBF]/20 border-[#7B3FBF]/50 text-[#F8FAFC]' : 'border-[rgba(123,63,191,0.1)] text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70'}`}>Пакет документов</button>
              </div>
              {mode === 'single' ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {DOCUMENT_TYPES.map(dt => {
                    const Icon = dt.icon;
                    const isActive = docType === dt.id;
                    return (
                      <button key={dt.id} onClick={() => setDocType(dt.id)} className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg border transition-all text-left ${isActive ? 'bg-[#7B3FBF]/15 border-[#7B3FBF]/40' : 'bg-[rgba(255,255,255,0.02)] border-[rgba(123,63,191,0.08)] hover:border-[rgba(123,63,191,0.2)]'}`}>
                        <Icon size={14} className={isActive ? 'text-[#C9A84C]' : 'text-[#F8FAFC]/25'} />
                        <div className="flex-1 min-w-0"><div className={`text-xs font-semibold truncate ${isActive ? 'text-[#F8FAFC]' : 'text-[#F8FAFC]/60'}`}>{dt.label}</div></div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {PACKAGES.map(p => (
                    <button key={p.id} onClick={() => setPackageType(p.id)} className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${packageType === p.id ? 'bg-[#7B3FBF]/15 border-[#7B3FBF]/40' : 'border-[rgba(123,63,191,0.08)] hover:border-[rgba(123,63,191,0.2)]'}`}>
                      <div className={`text-sm font-bold ${packageType === p.id ? 'text-[#F8FAFC]' : 'text-[#F8FAFC]/60'}`}>{p.label}</div>
                      <div className="text-xs text-[#F8FAFC]/30 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <button onClick={handleGenerate} disabled={!previewId || loading} className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm rounded-xl bg-[#7B3FBF]/20 border border-[#7B3FBF]/40 text-[#F8FAFC] hover:bg-[#7B3FBF]/30 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {loading ? <><Loader2 size={16} className="animate-spin" /><span>Генерация...</span></> : <><FileText size={16} /><span>Превью документа</span></>}
            </button>
            <button onClick={handleSaveToCandidates} disabled={selectedIds.size === 0 || saving} className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm rounded-xl bg-[#C9A84C] text-[#05070A] hover:bg-[#D9B85C] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {saving ? <><Loader2 size={16} className="animate-spin" /><span>Сохранение... {saveProgress?.done}/{saveProgress?.total}</span></> : <><Save size={16} /><span>Сгенерировать и сохранить ({selectedIds.size})</span></>}
            </button>

            {saving && saveProgress && (
              <div className="px-4 py-3 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[#C9A84C] font-bold">Сохранение документов...</span>
                  <span className="text-[#F8FAFC]/50">{saveProgress.done} / {saveProgress.total}</span>
                </div>
                <div className="h-2 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                  <div className="h-full rounded-full bg-[#C9A84C] transition-all duration-300" style={{ width: `${(saveProgress.done / saveProgress.total) * 100}%` }} />
                </div>
              </div>
            )}
            {success && <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-xs text-green-400 flex items-center gap-2"><CheckCircle size={14} /> {success}</div>}
            {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">{error}</div>}
          </div>

          {/* Right panel — preview */}
          <div className="glass-card rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '700px' }}>
            {preview ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(123,63,191,0.15)]">
                  <div className="flex items-center gap-3 min-w-0">
                    {packageDocs.length > 1 && (
                      <>
                        <button onClick={() => switchDoc(Math.max(0, activeDocIdx - 1))} disabled={activeDocIdx === 0} className="p-1 rounded hover:bg-[#7B3FBF]/20 text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-all disabled:opacity-20"><ChevronLeft size={16} /></button>
                        <span className="text-xs text-[#F8FAFC]/40 whitespace-nowrap">{activeDocIdx + 1} / {packageDocs.length}</span>
                        <button onClick={() => switchDoc(Math.min(packageDocs.length - 1, activeDocIdx + 1))} disabled={activeDocIdx === packageDocs.length - 1} className="p-1 rounded hover:bg-[#7B3FBF]/20 text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-all disabled:opacity-20"><ChevronRight size={16} /></button>
                      </>
                    )}
                    <div className="text-sm font-semibold text-[#F8FAFC]/80 truncate">
                      {packageDocs.length > 0 ? packageDocs[activeDocIdx]?.title : DOCUMENT_TYPES.find(d => d.id === docType)?.label}
                      {previewCandidate && <span className="text-[#F8FAFC]/30 ml-2">· {previewCandidate.full_name}</span>}
                    </div>
                  </div>
                  <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-all font-semibold whitespace-nowrap"><Printer size={14} /> Печать / PDF</button>
                </div>
                {packageDocs.length > 1 && (
                  <div className="flex gap-1 px-4 py-2 border-b border-[rgba(123,63,191,0.1)] overflow-x-auto">
                    {packageDocs.map((doc, idx) => (
                      <button key={idx} onClick={() => switchDoc(idx)} className={`px-3 py-1.5 text-xs rounded-lg border whitespace-nowrap transition-all ${idx === activeDocIdx ? 'bg-[#7B3FBF]/20 border-[#7B3FBF]/40 text-[#F8FAFC]' : 'border-[rgba(123,63,191,0.1)] text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70'}`}>{idx + 1}. {doc.title}</button>
                    ))}
                  </div>
                )}
                <iframe id="doc-preview" srcDoc={preview} className="w-full flex-1 bg-white" style={{ minHeight: '650px' }} title="Предпросмотр документа" />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <FileText size={48} className="text-[#7B3FBF]/20 mb-4" />
                <p className="text-sm text-[#F8FAFC]/30">{previewId ? 'Нажмите «Превью документа» для предпросмотра' : 'Выберите кандидата (кнопка «Превью») и тип документа'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
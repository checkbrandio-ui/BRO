import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Download, Search, Trash2, Edit2, X, MessageSquare, Shield, Stethoscope, Banknote, CheckCircle, MapPin, Navigation, CalendarDays, RefreshCw, Archive, ArchiveRestore, AlertTriangle, ClipboardList, ClipboardCopy, Link2, Sparkles, Loader2, Mail, Phone } from 'lucide-react';
import CandidateModal from '../../components/admin/CandidateModal';
import InlineCommentCell from '@/components/admin/InlineCommentCell';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { findDuplicateIds } from '@/lib/candidateDuplicates';
import { hasMissingRequiredDocs, getMissingRequiredDocs } from '@/lib/docUtils';
import { logCandidateAction } from '@/lib/candidateLogger';
import { notifyLogisticsChange } from '@/lib/notifyLogisticsChange';
import { notifyStatusChange } from '@/lib/notifyStatusChange';
import { findNearestAssemblyPoint, haversineDistance } from '@/lib/geoUtils';
import FormLinkModal from '@/components/admin/FormLinkModal';
import CandidateMapDrawer from '@/components/admin/CandidateMapDrawer';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import { useToast } from '@/components/ui/use-toast';
import { SB_BADGE, MED_BADGE, LOGISTICS_STATUS, SB_OPTIONS, MED_OPTIONS, isCIS } from '@/lib/candidateConstants';
import StatusDropdown from '@/components/ui/StatusDropdown';
import ArrivalsCalendar from '@/components/admin/ArrivalsCalendar';
import { getCurrentActor } from '@/lib/crmSession';

const POSITIONS = ['Разнорабочий','Строитель','Водитель B','Водитель C','Водитель CE','Водитель D','Автослесарь','Медицинский работник','Охранник'];
const SB_COLORS  = { 'Не проверялся':'text-[#F8FAFC]/40', 'На проверке':'text-yellow-400', 'Согласован':'text-green-400', 'Не согласован':'text-red-400' };
const MED_COLORS = { 'Не проверялся':'text-[#F8FAFC]/40', 'Прошёл':'text-green-400', 'Не прошёл':'text-red-400' };
const PAY_COLORS = { 'Готовится к отправке':'text-green-400', 'Отказался от отправки':'text-red-400/70' };

const isArchivable = (c) =>
  c.payment_made === 'Да' || c.payment_basis === 'Отказался от отправки';

function Tooltip({ text, children }) {
  return (
    <div className="relative group/tip inline-flex items-center">
      {children}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-[#0D1B3E] border border-[rgba(123,63,191,0.3)] text-xs text-[#F8FAFC]/80 whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-50 shadow-lg">
        {text}
      </div>
    </div>
  );
}

export default function Candidates() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState([]);
  const [agencies, setAgencies]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editCandidate, setEditCandidate] = useState(null);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ agency: searchParams.get('agency') || '', position: '', sb_check: '', medical_check: '', form_status: '', docs_filter: '', logistics_status: '', final_call: '' });
  const [showArchive, setShowArchive] = useState(false);
  const agenciesRef = useRef([]);
  const formDocsRef = useRef({});
  const [refLoaded, setRefLoaded] = useState(false);
  const [duplicateIds, setDuplicateIds] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [cityCache, setCityCache] = useState({});
  const [animatingId, setAnimatingId] = useState(null);
  const [linkModalCandidate, setLinkModalCandidate] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [logisticsPoint, setLogisticsPoint] = useState('');
  const [sortDir, setSortDir] = useState(null);
  const [mapCandidate, setMapCandidate] = useState(null);

  // Загрузка справочных данных (агентства, города, анкеты) — один раз при монтировании
  const loadReferenceData = useCallback(async () => {
    const [ag, cities, forms] = await Promise.all([
      base44.entities.Agency.list('-created_date', 200),
      base44.entities.City.list('-created_date', 500),
      base44.entities.CandidateForm.filter({ status: 'completed' }, '-created_date', 500),
    ]);
    const fDocsMap = {};
    forms.forEach(f => {
      if (f.candidate_id && f.uploaded_docs?.length) {
        fDocsMap[f.candidate_id] = f.uploaded_docs;
      }
    });
    const cityMap = {};
    cities.forEach(c => { if (c.name) cityMap[c.name.toLowerCase()] = c; });
    const activeAg = ag.filter(a => !a.deleted_at);
    agenciesRef.current = activeAg;
    formDocsRef.current = fDocsMap;
    setAgencies(activeAg);
    setCityCache(cityMap);
    setRefLoaded(true);
  }, []);

  // Загрузка кандидатов с серверной фильтрацией (deleted_at + базовые фильтры)
  const load = useCallback(async () => {
    if (!refLoaded) return;
    setLoading(true);
    // Серверный запрос: не загружаем удалённые записи + применяем активные фильтры
    const query = { deleted_at: null };
    if (filters.agency) query.agency_id = filters.agency;
    if (filters.position) query.position = filters.position;
    if (filters.sb_check && filters.sb_check !== 'Не проверялся') query.sb_check = filters.sb_check;
    if (filters.medical_check && filters.medical_check !== 'Не проверялся') query.medical_check = filters.medical_check;
    if (filters.form_status) query.form_status = filters.form_status;
    if (filters.logistics_status === 'confirmed') query.logistics_status = 'confirmed';
    const cand = await base44.entities.Candidate.filter(query, '-created_date', 500);
    const activeAgIds = new Set(agenciesRef.current.map(a => a.id));
    const filtered = cand
      .filter(c => !c.agency_id || activeAgIds.has(c.agency_id))
      .map(c => {
        const formDocs = formDocsRef.current[c.id];
        if (formDocs?.length) {
          const existingUrls = new Set((c.documents || []).map(d => d.url).filter(Boolean));
          const newDocs = formDocs.filter(fd => !existingUrls.has(fd.url));
          return { ...c, documents: [...(c.documents || []), ...newDocs] };
        }
        return c;
      });
    setCandidates(filtered);
    setDuplicateIds(findDuplicateIds(filtered));
    setLoading(false);
    setSelectedIds(new Set());
  }, [refLoaded, filters.agency, filters.position, filters.sb_check, filters.medical_check, filters.form_status, filters.logistics_status]);

  // Монтирование: справочные данные → затем кандидаты загружаются через [load] effect
  useEffect(() => {
    loadReferenceData();
    // Загружаем текущего пользователя для логов
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, [loadReferenceData]);

  // Повторный запрос кандидатов при изменении серверных фильтров
  useEffect(() => {
    load();
  }, [load]);

  // Realtime-подписка — обновляем только изменённую запись без перезагрузки таблицы
  useEffect(() => {
    const unsubscribe = base44.entities.Candidate.subscribe((event) => {
      if (!event.data) return;
      if (event.type === 'update') {
        setCandidates(prev => prev.map(c => {
          if (c.id !== event.data.id) return c;
          // Не перезаписываем виртуальное поле documents — оно мёрджится из анкет при load()
          const { documents, ...rest } = event.data;
          return { ...c, ...rest };
        }));
      } else if (event.type === 'create') {
        setCandidates(prev => prev.some(c => c.id === event.data.id) ? prev : [event.data, ...prev]);
      }
    });
    return unsubscribe;
  }, []);

  const getActor = () => getCurrentActor();

  const handleSave = async (data, id) => {
    if (id) {
      const old = candidates.find(c => c.id === id);
      const actor = getActor();
      await base44.entities.Candidate.update(id, data);
      await logCandidateAction({ action: 'update', candidate: { ...data, id }, oldData: old, actor });
      await notifyLogisticsChange({ ...data, id }, old, actor);
      await notifyStatusChange({ ...data, id }, old, actor);
      // Обновляем только изменённую запись в локальном состоянии — без полной перезагрузки
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      setModalOpen(false);
      setEditCandidate(null);
    } else {
      const response = await base44.functions.invoke('createCandidateSafe', {
        candidate_data: data,
        actor: getActor(),
      });
      if (response.data?.error === 'duplicate') {
        const ex = response.data.existing_candidate;
        alert(`Дубль: кандидат «${ex.full_name}» с датой рождения ${ex.birth_date} уже существует${ex.agency_name ? ` (агентство: ${ex.agency_name})` : ''}.\nСоздание заблокировано.`);
        return;
      }
      setModalOpen(false);
      setEditCandidate(null);
      const newCandidate = response.data?.candidate;
      // Добавляем нового кандидата в локальное состояние без перезагрузки.
      // Проверяем по ID — realtime-подписка могла уже добавить запись,
      // тогда обновляем, а не дублируем.
      if (newCandidate) {
        setCandidates(prev => prev.some(c => c.id === newCandidate.id)
          ? prev.map(c => c.id === newCandidate.id ? { ...c, ...newCandidate, ...data } : c)
          : [{ ...newCandidate, ...data }, ...prev]);
      } else {
        await load();
      }
      if (newCandidate?.form_token) {
        setLinkModalCandidate({ ...newCandidate, ...data });
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Переместить кандидата в корзину? Запись можно будет восстановить.')) return;
    const cand = candidates.find(c => c.id === id);
    const ts = new Date().toISOString();
    await base44.entities.Candidate.update(id, { deleted_at: ts });
    await logCandidateAction({ action: 'delete', candidate: { ...cand, deleted_at: ts }, actor: getActor() });
    if (cand?.agency_id) {
      const remaining = candidates.filter(c => c.id !== id && c.agency_id === cand.agency_id);
      await base44.entities.Agency.update(cand.agency_id, { candidates_count: remaining.length });
    }
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const handleArchive = async (c) => {
    await base44.entities.Candidate.update(c.id, { is_archived: true });
    await logCandidateAction({ action: 'update', candidate: { ...c, is_archived: true }, oldData: c, actor: getActor() });
    setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, is_archived: true } : x));
  };

  const handleUnarchive = async (c) => {
    await base44.entities.Candidate.update(c.id, { is_archived: false });
    await logCandidateAction({ action: 'update', candidate: { ...c, is_archived: false }, oldData: c, actor: getActor() });
    setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, is_archived: false } : x));
  };

  const exportCSV = () => {
    const src = showArchive ? filteredArchived : filteredActive;
    const headers = ['ФИО','Телефон','Должность','Агентство','Город','Пункт сбора','Дата рождения','Проверка СБ','Медкомиссия','Основание выплаты','Выплачено','Дата прибытия','Финальный прозвон','Дата добавления','Комментарий'];
    const rows = src.map(c => [
      c.full_name, c.phone, c.position, c.agency_name, c.city, c.assembly_point,
      c.birth_date, c.sb_check, c.medical_check,
      c.payment_basis, c.payment_made, c.arrival_date,
      c.final_call_confirmed ? 'Да' : 'Нет',
      c.created_date ? new Date(c.created_date).toLocaleString('ru-RU') : '',
      c.comment
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = showArchive ? 'candidates_archive.csv' : 'candidates.csv'; a.click();
  };

  const active   = candidates.filter(c => !c.is_archived);
  const archived = candidates.filter(c => c.is_archived);

  const applyFilters = (list) => {
    const q = search.toLowerCase();
    return list.filter(c => {
      const matchSearch = !q || c.full_name?.toLowerCase().includes(q) || c.position?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q) || c.phone?.includes(q);
      const matchAgency = !filters.agency || c.agency_id === filters.agency;
      const matchPos    = !filters.position || c.position === filters.position;
      const matchSB     = !filters.sb_check
        || (filters.sb_check === 'Не проверялся' ? (!c.sb_check || c.sb_check === 'Не проверялся') : c.sb_check === filters.sb_check);
      const matchMed    = !filters.medical_check
        || (filters.medical_check === 'Не проверялся' ? (!c.medical_check || c.medical_check === 'Не проверялся') : c.medical_check === filters.medical_check);
      const matchForm   = !filters.form_status || c.form_status === filters.form_status;
      const matchDocs   = filters.docs_filter === '' ? true : filters.docs_filter === 'missing' ? hasMissingRequiredDocs(c) : !hasMissingRequiredDocs(c);
      const matchLogistics = !filters.logistics_status
        || (filters.logistics_status === 'confirmed' && c.logistics_status === 'confirmed')
        || (filters.logistics_status === 'pending' && (c.logistics_status === 'pending_admin' || c.logistics_status === 'pending_candidate'))
        || (filters.logistics_status === 'none' && (c.logistics_status === 'none' || !c.logistics_status));
      const matchFinalCall = !filters.final_call
        || (filters.final_call === 'yes' && c.final_call_confirmed === true)
        || (filters.final_call === 'no' && !c.final_call_confirmed);
      return matchSearch && matchAgency && matchPos && matchSB && matchMed && matchForm && matchDocs && matchLogistics && matchFinalCall;
    });
  };

  const filteredActive   = applyFilters(active);
  const filteredArchived = applyFilters(archived);
  const logisticsCity = logisticsPoint ? cityCache[logisticsPoint.toLowerCase()] : null;
  const baseDisplayed = showArchive ? filteredArchived : filteredActive;
  const displayed = logisticsCity
    ? baseDisplayed.map(c => {
        const ci = cityCache[c.city?.toLowerCase()];
        const dist = (ci?.lat != null && ci?.lon != null) ? haversineDistance(ci.lat, ci.lon, logisticsCity.lat, logisticsCity.lon) : null;
        return { ...c, _distance: dist };
      }).sort((a, b) => {
        if (sortDir === 'asc') { if (a._distance == null) return 1; if (b._distance == null) return -1; return a._distance - b._distance; }
        if (sortDir === 'desc') { if (a._distance == null) return 1; if (b._distance == null) return -1; return b._distance - a._distance; }
        return 0;
      })
    : baseDisplayed;

  const selectedCandidates = candidates.filter(c => selectedIds.has(c.id));
  const missingFormsCount = selectedCandidates.filter(c => !c.form_token).length;
  const isAllDisplayedSelected = !showArchive && displayed.length > 0 && displayed.every(c => selectedIds.has(c.id));

  const handleAutoAssembly = async (c) => {
    if (!c.city) { alert('У кандидата не указан город проживания'); return; }
    setAnimatingId(c.id);
    try {
      // 1. Находим город кандидата в справочнике (cityCache уже загружен)
      const candidateCity = cityCache[c.city.toLowerCase()];
      if (!candidateCity || candidateCity.lat == null || candidateCity.lon == null) {
        alert(`Город «${c.city}» не найден в справочнике или у него нет координат. Добавьте город в справочник через ИИ-помощник.`);
        return;
      }

      // 2. Список городов-точек сбора = только города с флагом is_assembly_point, у которых есть координаты
      const assemblyPoints = Object.values(cityCache).filter(
        city => city.is_assembly_point === true && city.lat != null && city.lon != null && city.name.toLowerCase() !== c.city.toLowerCase()
      );

      if (!assemblyPoints.length) {
        alert('В справочнике нет городов с координатами для расчёта расстояний.');
        return;
      }

      // 3. Находим ближайший по формуле Гаверсинуса
      const result = findNearestAssemblyPoint(candidateCity.lat, candidateCity.lon, assemblyPoints);
      if (!result) {
        alert('Не удалось рассчитать расстояние до точек сбора.');
        return;
      }

      const nearest = result.point;
      const distanceKm = result.distance;

      const autoComment = `🤖 Точка сбора определена автоматически: ${nearest.name} (${distanceKm} км). Уточните возможность прибытия кандидата на медкомиссию и дату прибытия.`;
      // Удаляем старый авто-комментарий перед добавлением нового
      let baseComment = c.comment || '';
      const marker = '🤖 Точка сбора определена автоматически:';
      const markerIdx = baseComment.indexOf(marker);
      if (markerIdx !== -1) {
        baseComment = baseComment.substring(0, markerIdx).replace(/\n{2,}$/, '').trim();
      }
      const newComment = baseComment ? `${baseComment}\n\n${autoComment}` : autoComment;
      const updated = { assembly_point: nearest.name, assembly_distance: String(distanceKm), comment: newComment };

      await base44.entities.Candidate.update(c.id, updated);
      await logCandidateAction({ action: 'update', candidate: { ...c, ...updated }, oldData: c, actor: getActor() });
      setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, ...updated } : x));
    } finally {
      setAnimatingId(null);
    }
  };

  const generateFormToken = async (c) => {
    const token = 'cf-' + Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 10);
    await base44.entities.Candidate.update(c.id, { form_token: token, form_status: 'pending' });
    await base44.entities.CandidateForm.create({ candidate_id: c.id, form_token: token, status: 'pending' });
    setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, form_token: token, form_status: 'pending' } : x));
  };

  const regenerateFormToken = async (c) => {
    if (!c?.form_token) return;
    if (!confirm(`Перевыпустить ссылку на анкету для «${c.full_name}»?\n\nСтарая ссылка перестанет работать.`)) return;
    const newToken = 'cf-' + Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 10);
    await base44.entities.Candidate.update(c.id, { form_token: newToken, form_status: 'pending' });
    const oldForms = await base44.entities.CandidateForm.filter({ form_token: c.form_token });
    if (oldForms.length > 0) {
      await base44.entities.CandidateForm.update(oldForms[0].id, { form_token: newToken, status: 'pending' });
    }
    setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, form_token: newToken, form_status: 'pending' } : x));
  };

  const copyFormLink = (c) => {
    if (!c.form_token) return;
    const url = `${window.location.origin}/form/${c.form_token}`;
    navigator.clipboard.writeText(url);
  };

  const sendFormEmail = async (c) => {
    if (!c.email || !c.form_token) return;
    const url = `${window.location.origin}/form/${c.form_token}`;
    try {
      await base44.integrations.Core.SendEmail({
        to: c.email,
        subject: 'Заполнение анкеты кандидата — Bratouveriye SNB',
        body: `Здравствуйте, ${c.full_name}!\n\nПросим вас заполнить онлайн-анкету по ссылке:\n${url}\n\nЗаполнение займёт около 10 минут.\n\nС уважением,\nООО «БРО-СНБ-СНБ»`,
        from_name: 'Bratouveriye SNB',
      });
      const { dismiss } = toast({ title: '✓ Письмо отправлено', description: `На адрес ${c.email}` });
      setTimeout(dismiss, 3500);
    } catch (e) {
      const { dismiss } = toast({ title: 'Ошибка отправки', description: 'Не удалось отправить письмо. Попробуйте скопировать ссылку.', variant: 'destructive' });
      setTimeout(dismiss, 5000);
    }
  };

  // ─── Bulk Actions ───
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const allSelected = displayed.length > 0 && displayed.every(c => prev.has(c.id));
      if (allSelected) {
        const next = new Set(prev);
        displayed.forEach(c => next.delete(c.id));
        return next;
      }
      const next = new Set(prev);
      displayed.forEach(c => next.add(c.id));
      return next;
    });
  };

  const handleBulkStatus = async (field, value) => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const updates = ids.map(id => ({ id, [field]: value }));
      await base44.entities.Candidate.bulkUpdate(updates);
      await Promise.all(ids.map(id => {
        const old = candidates.find(c => c.id === id);
        return logCandidateAction({ action: 'update', candidate: { ...old, [field]: value }, oldData: old, actor: getActor() });
      }));
      setCandidates(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, [field]: value } : c));
      const labels = { sb_check: 'СБ', medical_check: 'Медкомиссия', payment_basis: 'Выплата', payment_made: 'Выплачено' };
      const { dismiss } = toast({ title: `✓ Обновлено: ${ids.length} чел.`, description: `${labels[field]} → ${value}` });
      setTimeout(dismiss, 3500);
      setSelectedIds(new Set());
    } catch (e) {
      const { dismiss } = toast({ title: 'Ошибка массового обновления', variant: 'destructive' });
      setTimeout(dismiss, 5000);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkFinalCall = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const ts = new Date().toISOString();
      const updates = ids.map(id => ({ id, final_call_confirmed: true, final_call_confirmed_at: ts }));
      await base44.entities.Candidate.bulkUpdate(updates);
      await Promise.all(ids.map(id => {
        const old = candidates.find(c => c.id === id);
        return logCandidateAction({ action: 'update', candidate: { ...old, final_call_confirmed: true, final_call_confirmed_at: ts }, oldData: old, actor: getActor() });
      }));
      setCandidates(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, final_call_confirmed: true, final_call_confirmed_at: ts } : c));
      const { dismiss } = toast({ title: `✓ Прозвон подтверждён: ${ids.length} чел.` });
      setTimeout(dismiss, 3500);
      setSelectedIds(new Set());
    } catch (e) {
      const { dismiss } = toast({ title: 'Ошибка', variant: 'destructive' });
      setTimeout(dismiss, 5000);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkCopyLinks = () => {
    const selected = candidates.filter(c => selectedIds.has(c.id));
    const withToken = selected.filter(c => c.form_token);
    const without = selected.length - withToken.length;
    if (!withToken.length) {
      const { dismiss } = toast({ title: 'Нет ссылок', description: 'У выбранных кандидатов нет анкет. Нажмите «Создать анкеты».', variant: 'destructive' });
      setTimeout(dismiss, 5000);
      return;
    }
    const lines = withToken.map((c, i) =>
      `${i + 1}. ${c.full_name} | ${c.city || '—'} | ${c.position || '—'}\n   Анкета: ${window.location.origin}/form/${c.form_token}`
    );
    const text = `📋 Подборка кандидатов (${withToken.length} чел.):\n\n${lines.join('\n\n')}`;
    navigator.clipboard.writeText(text);
    const msg = without > 0 ? `Скопировано ${withToken.length}, без анкеты: ${without}` : `Скопировано ${withToken.length} ссылок`;
    const { dismiss } = toast({ title: '✓ ' + msg });
    setTimeout(dismiss, 3500);
  };

  const handleBulkGenerateForms = async () => {
    const selected = candidates.filter(c => selectedIds.has(c.id) && !c.form_token);
    if (!selected.length) return;
    setBulkBusy(true);
    try {
      const updates = await Promise.all(selected.map(async c => {
        const token = 'cf-' + Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 10);
        await base44.entities.Candidate.update(c.id, { form_token: token, form_status: 'pending' });
        await base44.entities.CandidateForm.create({ candidate_id: c.id, form_token: token, status: 'pending' });
        return { id: c.id, form_token: token, form_status: 'pending' };
      }));
      setCandidates(prev => prev.map(c => {
        const u = updates.find(u => u.id === c.id);
        return u ? { ...c, ...u } : c;
      }));
      const { dismiss } = toast({ title: `✓ Создано ${updates.length} анкет`, description: 'Теперь можно копировать ссылки' });
      setTimeout(dismiss, 3500);
    } catch (e) {
      const { dismiss } = toast({ title: 'Ошибка создания анкет', variant: 'destructive' });
      setTimeout(dismiss, 5000);
    } finally {
      setBulkBusy(false);
    }
  };

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const inp = "px-3 py-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg text-sm text-[#F8FAFC] focus:outline-none focus:border-[#7B3FBF]";

  const readyCount = active.filter(c => c.payment_basis === 'Готовится к отправке').length;
  const paidCount  = active.filter(c => c.payment_made === 'Да').length;
  const sbCount = active.filter(c =>
    c.sb_check === 'Согласован' &&
    c.medical_check !== 'Прошёл' &&
    c.payment_basis !== 'Готовится к отправке' &&
    c.payment_made !== 'Да'
  ).length;
  const medCount = active.filter(c =>
    c.medical_check === 'Прошёл' &&
    c.payment_basis !== 'Готовится к отправке' &&
    c.payment_made !== 'Да'
  ).length;

  const dupCount = [...duplicateIds].filter(id => active.some(c => c.id === id)).length;

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F8FAFC]">
      {/* Header */}
      <div className="border-b border-[rgba(123,63,191,0.15)] bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to="/" className="flex items-center gap-2 text-[#F8FAFC]/50 hover:text-[#F8FAFC] transition-colors">
              <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png" className="w-7 h-7 object-contain" alt="logo" />
            </Link>
            <span className="text-[rgba(123,63,191,0.4)]">/</span>
            <Link to="/admin/agencies" className="text-sm text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-colors">База агентств</Link>
            <span className="text-[rgba(123,63,191,0.4)]">/</span>
            <h1 className="text-sm font-bold text-[#F8FAFC]">База кандидатов</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <Link to="/admin/assistant" className="hidden lg:flex items-center gap-2 px-4 py-2 text-xs rounded border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all">
              <Sparkles size={13}/> ИИ-помощник
            </Link>
            <Link to="/admin/assembly-points" className="hidden lg:flex items-center gap-2 px-4 py-2 text-xs rounded border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all">
              <MapPin size={13}/> Точки сбора
            </Link>
            <Link to="/admin/candidate-logs" className="hidden md:flex items-center gap-2 px-4 py-2 text-xs rounded border border-[rgba(123,63,191,0.25)] text-[#F8FAFC]/50 hover:text-[#7B3FBF] hover:border-[#7B3FBF]/40 transition-all">
              <ClipboardList size={13}/> Журнал
            </Link>
            <Link to="/admin/trash" className="hidden md:flex items-center gap-2 px-4 py-2 text-xs rounded border border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/40 hover:text-red-400 hover:border-red-500/30 transition-all">
              <Trash2 size={13}/> Корзина
            </Link>

            <button onClick={async () => { await loadReferenceData(); await load(); }} title="Обновить данные"
              className="p-2 rounded-lg border border-[rgba(123,63,191,0.2)] text-[#F8FAFC]/50 hover:text-[#7B3FBF] hover:border-[#7B3FBF]/40 transition-all">
              <RefreshCw size={14} />
            </button>
            {archived.length > 0 && (
              <button onClick={() => setShowArchive(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 text-xs rounded border transition-all ${showArchive ? 'border-[#C9A84C]/50 text-[#C9A84C] bg-[#C9A84C]/10' : 'border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/40 hover:text-[#C9A84C]'}`}>
                <Archive size={13} /> Архив ({archived.length})
              </button>
            )}
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 text-xs rounded border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all">
              <Download size={14} /> Экспорт CSV
            </button>
            {!showArchive && (
              <button onClick={() => { setEditCandidate(null); setModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 text-xs rounded bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] transition-all">
                <Plus size={14} /> Добавить кандидата
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Предупреждение о дублях */}
        {dupCount > 0 && !showArchive && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
            <AlertTriangle size={15} className="flex-shrink-0"/>
            <span>Обнаружено <strong>{dupCount}</strong> дублирующих записей — выделены красным в таблице</span>
          </div>
        )}

        {/* Stats */}
        {!showArchive && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Всего активных', value: active.length },
              { label: 'Согласованы СБ', value: sbCount },
              { label: 'Прошли медкомиссию', value: medCount },
              { label: 'К отправке', value: readyCount },
              { label: 'Выплачено (чел.)', value: paidCount, sub: `${(paidCount * 100000).toLocaleString('ru-RU')} ₽` },
            ].map(s => (
              <div key={s.label} className="glass-card rounded-xl p-4">
                <div className="text-2xl font-black text-[#7B3FBF]">{s.value}</div>
                <div className="text-xs text-[#F8FAFC]/45 mt-1">{s.label}</div>
                {s.sub && <div className="text-xs text-[#C9A84C] font-bold mt-0.5">{s.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Календарь прибытий */}
        {!showArchive && <ArrivalsCalendar candidates={active} />}

        {showArchive && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/20 text-xs text-[#C9A84C]/80 flex items-center gap-2">
            <Archive size={13} /> Архив: кандидаты с закрытыми контрактами или отказавшиеся от участия. Можно восстановить в основную таблицу.
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F8FAFC]/30" />
            <input type="text" placeholder="Поиск по ФИО, должности, городу, телефону..."
              value={search} onChange={e => setSearch(e.target.value)}
              className={inp + ' w-full pl-9'} />
          </div>
          <select value={filters.agency} onChange={e => setF('agency', e.target.value)} className={inp}>
            <option value="">Все агентства</option>
            {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filters.position} onChange={e => setF('position', e.target.value)} className={inp}>
            <option value="">Все должности</option>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <StatusDropdown
            value={filters.sb_check}
            onChange={v => setF('sb_check', v)}
            options={SB_OPTIONS}
            placeholder="Проверка СБ"
            allowEmpty
            emptyLabel="Проверка СБ: все"
            icon={Shield}
            compact
          />
          <StatusDropdown
            value={filters.medical_check}
            onChange={v => setF('medical_check', v)}
            options={MED_OPTIONS}
            placeholder="Медкомиссия"
            allowEmpty
            emptyLabel="Медкомиссия: все"
            icon={Stethoscope}
            compact
          />
          <select value={filters.form_status} onChange={e => setF('form_status', e.target.value)} className={inp}>
            <option value="">Анкета: все</option>
            <option value="completed">Анкета заполнена</option>
            <option value="pending">Анкета не заполнена</option>
          </select>
          <select value={logisticsPoint} onChange={e => { setLogisticsPoint(e.target.value); setSortDir(e.target.value ? 'asc' : null); }} className={inp}>
            <option value="">— Логистика —</option>
            {Object.values(cityCache)
              .filter(c => c.is_assembly_point)
              .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
              .map(ap => (
                <option key={ap.id || ap.name} value={ap.name}>{ap.name}</option>
              ))}
          </select>
          <button
            onClick={() => setF('docs_filter', filters.docs_filter === '' ? 'missing' : filters.docs_filter === 'missing' ? 'complete' : '')}
            className={`flex items-center gap-2 px-4 py-2 text-xs rounded border transition-all whitespace-nowrap ${
              filters.docs_filter === 'missing' ? 'border-red-500/50 text-red-400 bg-red-500/10' :
              filters.docs_filter === 'complete' ? 'border-green-500/50 text-green-400 bg-green-500/10' :
              'border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/40 hover:text-[#7B3FBF]'
            }`}>
            {filters.docs_filter === 'complete' ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
            {filters.docs_filter === 'missing' ? 'Без обяз. док.' : filters.docs_filter === 'complete' ? 'С полным пак.' : 'Документы'}
          </button>
          <StatusDropdown
            value={filters.logistics_status}
            onChange={v => setF('logistics_status', v)}
            options={[
              { value: 'confirmed', label: 'Согласовано' },
              { value: 'pending', label: 'На согласовании' },
              { value: 'none', label: 'Не отправлено' },
            ]}
            placeholder="Логистика: все"
            allowEmpty
            emptyLabel="Логистика: все"
            icon={Navigation}
            compact
          />
          <button
            onClick={() => setF('final_call', filters.final_call === '' ? 'yes' : filters.final_call === 'yes' ? 'no' : '')}
            className={`flex items-center gap-2 px-4 py-2 text-xs rounded border transition-all whitespace-nowrap ${
              filters.final_call === 'yes' ? 'border-green-500/50 text-green-400 bg-green-500/10' :
              filters.final_call === 'no' ? 'border-red-500/50 text-red-400 bg-red-500/10' :
              'border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/40 hover:text-[#7B3FBF]'
            }`}>
            <Phone size={13} />
            {filters.final_call === 'yes' ? 'Прозвон ✓' : filters.final_call === 'no' ? 'Не прозвонен' : 'Прозвон'}
          </button>
          {(Object.values(filters).some(f => typeof f === 'string' ? f : f) || logisticsPoint) && (
            <button onClick={() => {               setFilters({ agency:'', position:'', sb_check:'', medical_check:'', form_status:'', docs_filter: '', logistics_status: '', final_call: '' }); setLogisticsPoint(''); setSortDir(null); }}
              className="flex items-center gap-1 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
              <X size={12} /> Сбросить
            </button>
          )}
        </div>

        <div className="text-xs text-[#F8FAFC]/30 mb-4">
          {showArchive ? `Архив: ${filteredArchived.length} из ${archived.length}` : `Показано: ${filteredActive.length} из ${active.length}`}
        </div>

        {!showArchive && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            onClear={() => setSelectedIds(new Set())}
            onApplyStatus={handleBulkStatus}
            onCopyLinks={handleBulkCopyLinks}
            onGenerateForms={handleBulkGenerateForms}
            onFinalCall={handleBulkFinalCall}
            busy={bulkBusy}
            canEditStatuses={true}
            missingFormsCount={missingFormsCount}
          />
        )}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#7B3FBF]/30 border-t-[#7B3FBF] rounded-full animate-spin" /></div>
        ) : (
          <div className="glass-card rounded-xl">
            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(123,63,191,0.15)]">
                    {!showArchive && (
                      <th className="px-4 py-3 w-8">
                        <input type="checkbox" checked={isAllDisplayedSelected} onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-[rgba(123,63,191,0.3)] bg-transparent accent-[#7B3FBF] cursor-pointer" />
                      </th>
                    )}
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider">ФИО / Агентство</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider whitespace-nowrap">Должность</th>
                    <th className="px-4 py-3"><Tooltip text="Город / Пункт сбора"><MapPin size={13} className="text-[#F8FAFC]/35" /></Tooltip></th>
                    {logisticsPoint && (
                      <th className="px-4 py-3 cursor-pointer select-none" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc')}>
                        <div className="flex items-center justify-center gap-1 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider">
                          <Navigation size={12} /> {sortDir === 'asc' ? '↑' : sortDir === 'desc' ? '↓' : ''}
                        </div>
                      </th>
                    )}
                    <th className="px-4 py-3"><Tooltip text="Проверка СБ"><Shield size={13} className="text-[#F8FAFC]/35" /></Tooltip></th>
                    <th className="px-4 py-3"><Tooltip text="Медкомиссия"><Stethoscope size={13} className="text-[#F8FAFC]/35" /></Tooltip></th>
                    <th className="px-4 py-3"><Tooltip text="Дата прибытия"><CalendarDays size={13} className="text-[#F8FAFC]/35" /></Tooltip></th>
                    <th className="px-4 py-3"><Tooltip text="Финальный прозвон"><Phone size={13} className="text-[#F8FAFC]/35" /></Tooltip></th>
                    <th className="px-4 py-3"><Tooltip text="Основание для выплаты"><Banknote size={13} className="text-[#F8FAFC]/35" /></Tooltip></th>
                    <th className="px-4 py-3"><Tooltip text="Выплачено"><CheckCircle size={13} className="text-[#F8FAFC]/35" /></Tooltip></th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider whitespace-nowrap">Добавлен</th>
                    <th className="px-4 py-3"><Tooltip text="Комментарий"><MessageSquare size={13} className="text-[#F8FAFC]/35" /></Tooltip></th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider whitespace-nowrap"><Tooltip text="Онлайн-анкета"><Link2 size={13} className="text-[#F8FAFC]/35" /></Tooltip></th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((c) => {
                    const isDuplicate = duplicateIds.has(c.id);
                    const rowClass = isDuplicate
                      ? 'border-b border-red-500/30 bg-red-500/8 hover:bg-red-500/12 transition-colors'
                      : 'border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(123,63,191,0.06)] transition-colors';
                    return (
                      <tr key={c.id} className={rowClass}>
                        {!showArchive && (
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)}
                              className="w-4 h-4 rounded border-[rgba(123,63,191,0.3)] bg-transparent accent-[#7B3FBF] cursor-pointer" />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {isDuplicate && (
                              <Tooltip text="Дубль: кандидат с таким ФИО и датой рождения уже есть в базе">
                                <AlertTriangle size={13} className="text-red-400 flex-shrink-0"/>
                              </Tooltip>
                            )}
                            {hasMissingRequiredDocs(c) && (
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <span className="cursor-help flex-shrink-0">
                                    <AlertTriangle size={13} className="text-red-400"/>
                                  </span>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-64 bg-[#0D1B3E] border-red-500/30 text-[#F8FAFC]">
                                  <div className="space-y-1.5 text-xs">
                                    <div className="font-bold text-red-400">Не хватает обязательных документов:</div>
                                    {getMissingRequiredDocs(c.documents || []).map(m => (
                                      <div key={m.id} className="text-[#F8FAFC]/60 flex items-center gap-1.5">
                                        <span className="text-red-400">•</span> {m.label}
                                      </div>
                                    ))}
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            )}
                            <div>
                              <div className={`font-bold ${isDuplicate ? 'text-red-300' : 'text-[#F8FAFC]'}`}>
                                {c.full_name}
                                {isCIS(c.citizenship) && (
                                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/25 align-middle" title={`Гражданство: ${c.citizenship}`}>
                                    {c.citizenship}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#F8FAFC]/35">{c.agency_name || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#F8FAFC]/60 text-xs whitespace-nowrap">{c.position || '—'}</td>
                        <td className="px-4 py-3 text-xs text-[#F8FAFC]/55">
                          {c.city ? (
                            <button onClick={() => setMapCandidate(c)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-[#7B3FBF] transition-colors flex items-center gap-1">
                              <MapPin size={11} className="opacity-40 flex-shrink-0" />
                              {c.city}
                            </button>
                          ) : '—'}
                          {c.assembly_point && <div className="text-[#F8FAFC]/30 mt-0.5">{c.assembly_point}</div>}
                        </td>
                        {logisticsPoint && (
                          <td className="px-4 py-3 text-xs text-center whitespace-nowrap">
                            {c._distance != null ? (
                              <span className="text-[#C9A84C] font-bold">{c._distance} км</span>
                            ) : <span className="text-[#F8FAFC]/25">—</span>}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${SB_BADGE[c.sb_check]?.bg || 'bg-[#F8FAFC]/5'} ${SB_BADGE[c.sb_check]?.color || 'text-[#F8FAFC]/40'} ${SB_BADGE[c.sb_check]?.border || 'border-[#F8FAFC]/10'}`}>
                            {SB_BADGE[c.sb_check]?.icon || '○'} {c.sb_check || 'Не проверялся'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${MED_BADGE[c.medical_check]?.bg || 'bg-[#F8FAFC]/5'} ${MED_BADGE[c.medical_check]?.color || 'text-[#F8FAFC]/40'} ${MED_BADGE[c.medical_check]?.border || 'border-[#F8FAFC]/10'}`}>
                            {MED_BADGE[c.medical_check]?.icon || '○'} {c.medical_check || 'Не проверялся'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {c.arrival_date ? (
                            <span className="text-[#F8FAFC]/60">{c.arrival_date.split('-').reverse().join('.')}{c.arrival_time ? ` ${c.arrival_time}` : ''}</span>
                          ) : <span className="text-[#F8FAFC]/25">—</span>}
                          {c.logistics_status && c.logistics_status !== 'none' && (
                            <div className={`text-[10px] mt-0.5 ${LOGISTICS_STATUS[c.logistics_status]?.color || 'text-[#F8FAFC]/30'}`}>
                              {LOGISTICS_STATUS[c.logistics_status]?.icon} {LOGISTICS_STATUS[c.logistics_status]?.label}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {c.final_call_confirmed ? (
                            <Tooltip text={`Прозвон подтверждён: ${c.final_call_confirmed_at ? new Date(c.final_call_confirmed_at).toLocaleString('ru-RU') : ''}`}>
                              <CheckCircle size={15} className="text-green-400 mx-auto" />
                            </Tooltip>
                          ) : (
                            <Phone size={14} className="text-[#F8FAFC]/20 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${PAY_COLORS[c.payment_basis] || 'text-[#F8FAFC]/25'}`}>
                            {c.payment_basis || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${c.payment_made === 'Да' ? 'text-green-400' : 'text-[#F8FAFC]/30'}`}>
                            {c.payment_made === 'Да' ? '✓ Да' : 'Нет'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#F8FAFC]/40 whitespace-nowrap">
                          {c.created_date
                            ? new Date(c.created_date).toLocaleDateString('ru-RU') + ' ' + new Date(c.created_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <InlineCommentCell candidate={c} onUpdate={(id, data) => setCandidates(prev => prev.map(x => x.id === id ? { ...x, ...data } : x))} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {c.form_status === 'completed' && (
                              <a href={`/form/${c.form_token}?edit=1`} target="_blank" rel="noreferrer"
                                className="text-xs px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/25 whitespace-nowrap hover:bg-green-500/25 transition-all cursor-pointer">✓ Заполнена</a>
                            )}
                            {c.form_token && c.form_status !== 'completed' && (
                              <>
                                <button onClick={() => copyFormLink(c)} title="Скопировать ссылку на анкету"
                                  className="p-1.5 rounded hover:bg-[#7B3FBF]/20 text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-all">
                                  <ClipboardCopy size={13} />
                                </button>
                                <button onClick={() => regenerateFormToken(c)} title="Перевыпустить ссылку"
                                  className="p-1.5 rounded hover:bg-red-500/20 text-[#F8FAFC]/50 hover:text-red-400 transition-all">
                                  <RefreshCw size={13} />
                                </button>
                                {c.email && (
                                  <button onClick={() => sendFormEmail(c)} title={`Отправить на ${c.email}`}
                                    className="p-1.5 rounded hover:bg-[#C9A84C]/20 text-[#F8FAFC]/50 hover:text-[#C9A84C] transition-all">
                                    <Mail size={13} />
                                  </button>
                                )}
                              </>
                            )}
                            {!c.form_token && (
                              <button onClick={() => generateFormToken(c)} title="Создать анкету"
                                className="text-xs text-white/30 hover:text-[#7B3FBF] transition-all">+ Создать</button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {showArchive ? (
                              <button onClick={() => handleUnarchive(c)} title="Вернуть из архива"
                                className="p-1.5 rounded hover:bg-green-500/20 text-[#F8FAFC]/50 hover:text-green-400 transition-all">
                                <ArchiveRestore size={14}/>
                              </button>
                            ) : (
                              <>
                                {c.form_status === 'completed' && c.city && (
                                  <button onClick={() => handleAutoAssembly(c)} title="Авто-подбор точки сбора" disabled={animatingId === c.id}
                                    className={`p-1.5 rounded transition-all ${animatingId === c.id ? 'opacity-50 cursor-wait' : ''} ${c.assembly_point ? 'bg-[#C9A84C]/15 text-[#C9A84C] hover:bg-[#C9A84C]/25' : 'text-[#F8FAFC]/50 hover:bg-[#C9A84C]/20 hover:text-[#C9A84C]'}`}>
                                    {animatingId === c.id ? <Loader2 size={14} className="animate-spin"/> : <MapPin size={14}/>}
                                  </button>
                                )}
                                <button onClick={() => { setEditCandidate(c); setModalOpen(true); }}
                                  className="p-1.5 rounded hover:bg-[#7B3FBF]/20 text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-all">
                                  <Edit2 size={14}/>
                                </button>
                                {isArchivable(c) && (
                                  <button onClick={() => handleArchive(c)} title="Переместить в архив"
                                    className="p-1.5 rounded hover:bg-[#C9A84C]/20 text-[#F8FAFC]/50 hover:text-[#C9A84C] transition-all">
                                    <Archive size={14}/>
                                  </button>
                                )}
                              </>
                            )}
                            <button onClick={() => handleDelete(c.id)}
                              className="p-1.5 rounded hover:bg-red-500/20 text-[#F8FAFC]/50 hover:text-red-400 transition-all">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {displayed.length === 0 && (
                    <tr><td colSpan={(showArchive ? 12 : 13) + (logisticsPoint ? 1 : 0)} className="text-center py-12 text-[#F8FAFC]/30">
                      {showArchive ? 'Архив пуст' : 'Кандидаты не найдены'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <CandidateModal
          candidate={editCandidate}
          agencies={agencies}
          candidateList={displayed}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditCandidate(null); }}
          onNavigate={(cand) => setEditCandidate(cand)}
        />
      )}

      {linkModalCandidate && (
        <FormLinkModal
          candidate={linkModalCandidate}
          onClose={() => setLinkModalCandidate(null)}
        />
      )}

      {mapCandidate && (
        <CandidateMapDrawer
          candidate={mapCandidate}
          cityCache={cityCache}
          onClose={() => setMapCandidate(null)}
          onAssignAssemblyPoint={async (pointName, distance) => {
            const updated = { assembly_point: pointName, assembly_distance: distance != null ? String(distance) : '' };
            await base44.entities.Candidate.update(mapCandidate.id, updated);
            await logCandidateAction({ action: 'update', candidate: { ...mapCandidate, ...updated }, oldData: mapCandidate, actor: getActor() });
            setCandidates(prev => prev.map(x => x.id === mapCandidate.id ? { ...x, ...updated } : x));
            setMapCandidate(prev => prev ? { ...prev, ...updated } : prev);
          }}
        />
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { X, Upload, Trash2, Download, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { uploadWithRetry, validateFile } from '@/lib/uploadWithRetry';
import CandidateFormView from './CandidateFormView';
import CitySelect from '@/components/CitySelect';
import { getDocTypesForCitizenship, getMissingRequiredDocs } from '@/lib/docUtils';
import { CITIZENSHIPS, isCIS, LOGISTICS_STATUS, SB_OPTIONS, MED_OPTIONS } from '@/lib/candidateConstants';
import SbReportButton from '@/components/admin/SbReportButton';
import StatusDropdown from '@/components/ui/StatusDropdown';
import { findNearestAssemblyPoint } from '@/lib/geoUtils';

const POSITIONS = ['Разнорабочий','Строитель','Водитель B','Водитель C','Водитель CE','Водитель D','Автослесарь','Инженер связи','Оператор БПЛА','Взрывотехник','Медицинский работник','Охранник'];

export default function CandidateModal({ candidate, agencies, lockedAgencyId, onSave, onClose }) {
  const isAgencyMode = !!lockedAgencyId; // режим агентства — без выбора агентства и статусов

  const [form, setForm] = useState({
    full_name: candidate?.full_name || '',
    position: candidate?.position || '',
    agency_id: candidate?.agency_id || lockedAgencyId || '',
    agency_name: candidate?.agency_name || (agencies?.find(a => a.id === lockedAgencyId)?.name || ''),
    birth_date: candidate?.birth_date ?? '',
    citizenship: candidate?.citizenship ?? '',
    birth_place: candidate?.birth_place ?? '',
    health_status: candidate?.health_status ?? '',
    health_details: candidate?.health_details ?? '',
    city: candidate?.city ?? '',
    assembly_point: candidate?.assembly_point ?? '',
    arrival_date: candidate?.arrival_date ?? '',
    sb_check: candidate?.sb_check ?? '',
    medical_check: candidate?.medical_check ?? '',
    comment: candidate?.comment ?? '',
    phone: candidate?.phone ?? '',
    email: candidate?.email ?? '',
    payment_basis: candidate?.payment_basis ?? '',
    payment_made: candidate?.payment_made ?? '',
    arrival_time: candidate?.arrival_time ?? '',
    ticket_photo_url: candidate?.ticket_photo_url ?? '',
    logistics_status: candidate?.logistics_status ?? 'none',
    logistics_confirmed_at: candidate?.logistics_confirmed_at ?? '',
    proposed_assembly_point: candidate?.proposed_assembly_point ?? '',
    proposed_arrival_date: candidate?.proposed_arrival_date ?? '',
    proposed_arrival_time: candidate?.proposed_arrival_time ?? '',
    proposed_by: candidate?.proposed_by ?? '',
  });

  const [stopList, setStopList]     = useState(null);
  const [checking, setChecking]     = useState(false);
  const [formDocs, setFormDocs]     = useState([]); // документы из анкеты (единый источник)
  const [candidateFormId, setCandidateFormId] = useState(null);
  const [candidateFormData, setCandidateFormData] = useState(null);
  const [uploadingDocType, setUploadingDocType] = useState(null);
  const [uploadErrors, setUploadErrors] = useState({});
  const [activeTab, setActiveTab]   = useState('card');
  const [cityObject, setCityObject] = useState(null);
  const [assemblyPoints, setAssemblyPoints] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [cityCache, setCityCache] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.City.filter({ is_assembly_point: true }, '-created_date', 200)
      .then(setAssemblyPoints)
      .catch(() => {});
    base44.entities.City.list('-created_date', 500).then(cities => {
      const map = {};
      cities.forEach(c => { if (c.name && c.lat != null && c.lon != null) map[c.name.toLowerCase()] = c; });
      setCityCache(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!candidate?.id) return;
    base44.entities.CandidateForm.filter({ candidate_id: candidate.id }).then(async records => {
      if (records.length > 0) {
        const rec = records.find(r => r.status === 'completed') || records[0];
        setCandidateFormId(rec.id);
        setFormDocs(rec.uploaded_docs || []);
        setCandidateFormData(rec);
      } else {
        // Создаём анкету, если её нет — чтобы админ мог загружать документы
        const token = 'cf-' + Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 10);
        const newForm = await base44.entities.CandidateForm.create({ candidate_id: candidate.id, form_token: token, status: 'pending' });
        await base44.entities.Candidate.update(candidate.id, { form_token: token, form_status: 'pending' });
        setCandidateFormId(newForm.id);
      }
    });
  }, [candidate?.id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAgencyChange = (agencyId) => {
    const agency = agencies.find(a => a.id === agencyId);
    set('agency_id', agencyId);
    set('agency_name', agency?.name || '');
  };

  // Проверка стоп-листа при изменении ФИО или даты рождения
  const checkStopList = async (full_name, birth_date) => {
    if (!full_name || !birth_date) { setStopList(null); return; }
    setChecking(true);
    const found = await base44.entities.Candidate.filter({ full_name, birth_date });
    // Исключаем текущего редактируемого кандидата
    const others = found.filter(c => c.id !== candidate?.id && !c.deleted_at);
    if (others.length > 0) {
      setStopList({ full_name: others[0].full_name, agency_name: others[0].agency_name });
    } else {
      setStopList(null);
    }
    setChecking(false);
  };

  const handleNameChange = (v) => {
    set('full_name', v);
    checkStopList(v, form.birth_date);
  };

  const handleBirthDateChange = (v) => {
    set('birth_date', v);
    checkStopList(form.full_name, v);
  };

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

  // Расчет расстояния при смене точки сбора
  const handleAssemblyPointChange = async (assemblyPointName) => {
    set('assembly_point', assemblyPointName);
    if (!form.city || !assemblyPointName) return;
    
    const candidateCity = cityCache[form.city.toLowerCase()];
    const selectedPoint = Object.values(cityCache).find(c => c.name === assemblyPointName);
    
    if (!candidateCity?.lat || !candidateCity?.lon || !selectedPoint?.lat || !selectedPoint?.lon) return;
    
    const result = findNearestAssemblyPoint(candidateCity.lat, candidateCity.lon, [selectedPoint]);
    if (result) {
      const distance = result.distance;
      set('assembly_distance', String(distance));
      
      const role = user?.role === 'admin' ? 'Администратор' : 'Модератор';
      const timestamp = new Date().toLocaleString('ru-RU');
      const newCommentText = `[${role} | ${timestamp}] Выбрана точка сбора: ${assemblyPointName} (${distance} км)`;
      
      const oldComments = (form.comment || '').split('\n---\n');
      const baseComment = oldComments[0]?.trim() || '';
      const newComment = baseComment ? `${baseComment}\n---\n${newCommentText}` : newCommentText;
      set('comment', newComment);
    }
  };

  const handleSaveClick = async () => {
    if (stopList) return;
    const newErrors = {};
    if (!form.full_name?.trim()) newErrors.full_name = true;
    if (!form.birth_date) newErrors.birth_date = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    if (form.city && !cityObject) {
      alert('Пожалуйста, выберите населённый пункт из списка. Текстовый ввод не допускается — выберите ближайший из каталога.');
      return;
    }
    setSaving(true);
    try {
      // Сохраняем документы в анкету (единый источник истины)
      if (candidateFormId) {
        await base44.entities.CandidateForm.update(candidateFormId, {
          uploaded_docs: formDocs,
        });
      }
      // Сохраняем карточку кандидата (без поля documents — оно формируется из анкеты)
      const { documents, ...candidateData } = form;
      await onSave(candidateData, candidate?.id);
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/25 focus:outline-none focus:border-[#7B3FBF] transition-all";
  const paymentAmount = form.payment_basis === 'Готовится к отправке' ? '100 000 ₽' : form.payment_basis === 'Отказался от отправки' ? 'Не предусмотрена' : '—';
  const missingDocs = getMissingRequiredDocs(formDocs, form.citizenship);
  const docTypes = getDocTypesForCitizenship(form.citizenship);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D1B3E] border border-[rgba(123,63,191,0.25)] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[rgba(123,63,191,0.15)] sticky top-0 bg-[#0D1B3E] z-10">
          <h2 className="text-lg font-black text-[#F8FAFC]">{candidate ? 'Редактировать кандидата' : 'Новый кандидат'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all text-[#F8FAFC]/60"><X size={18} /></button>
        </div>

        {candidate?.id && (
          <div className="flex border-b border-[rgba(123,63,191,0.15)] bg-[#0D1B3E]">
            <button onClick={() => setActiveTab('card')}
              className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 'card' ? 'text-[#7B3FBF] border-b-2 border-[#7B3FBF]' : 'text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70'}`}>
              Карточка
            </button>
            <button onClick={() => setActiveTab('questionnaire')}
              className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 'questionnaire' ? 'text-[#7B3FBF] border-b-2 border-[#7B3FBF]' : 'text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70'}`}>
              Анкета кандидата
            </button>
          </div>
        )}

        <div className={`p-6 space-y-5 ${activeTab === 'card' || !candidate?.id ? '' : 'hidden'}`}>
          {/* Предупреждение о неполных документах */}
          {candidate?.id && missingDocs.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-red-400">Неполный пакет документов</div>
                <div className="text-xs text-red-300/80 mt-1">
                  Не хватает: {missingDocs.map(d => d.label).join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Стоп-лист предупреждение */}
          {stopList && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-red-400">СТОП-ЛИСТ: Кандидат уже в базе</div>
                <div className="text-xs text-red-300/80 mt-1">
                  «{stopList.full_name}» с такой датой рождения уже зарегистрирован
                  {stopList.agency_name ? ` (агентство: ${stopList.agency_name})` : ''}.
                  Сохранение заблокировано.
                </div>
              </div>
            </div>
          )}

          {/* Base info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">ФИО <span className="text-red-400">*</span></label>
              <input className={inp + (errors.full_name ? ' !border-red-500' : '')} value={form.full_name} onChange={e => { handleNameChange(e.target.value); if (errors.full_name) setErrors(p => ({ ...p, full_name: false })); }} placeholder="Иванов Иван Иванович" />
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Дата рождения <span className="text-red-400">*</span></label>
              <input className={inp + (errors.birth_date ? ' !border-red-500' : '')} type="date" value={form.birth_date} onChange={e => { handleBirthDateChange(e.target.value); if (errors.birth_date) setErrors(p => ({ ...p, birth_date: false })); }} />
              {checking && <p className="text-xs text-[#F8FAFC]/30 mt-1">Проверка стоп-листа...</p>}
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Телефон</label>
              <input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 (___) ___-__-__" />
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Email</label>
              <input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="example@mail.ru" />
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Должность</label>
              <select className={inp} value={form.position} onChange={e => set('position', e.target.value)}>
                <option value="">Выберите...</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {/* Агентство показываем только в режиме администратора */}
            {!isAgencyMode && (
              <div>
                <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Кадровое агентство</label>
                <select className={inp} value={form.agency_id} onChange={e => handleAgencyChange(e.target.value)}>
                  <option value="">Выберите...</option>
                  {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Гражданство</label>
              <select className={inp} value={form.citizenship} onChange={e => set('citizenship', e.target.value)}>
                <option value="">Выберите...</option>
                {CITIZENSHIPS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Место рождения</label>
              <input className={inp} value={form.birth_place} onChange={e => set('birth_place', e.target.value)} placeholder="г. Москва" />
            </div>

            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Город проживания</label>
              <CitySelect
                value={form.city}
                onChange={val => set('city', val)}
                onCitySelect={setCityObject}
                inputClassName={inp}
                placeholder="г. Хабаровск"
              />
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Пункт сбора</label>
              <select className={inp} value={form.assembly_point} onChange={e => handleAssemblyPointChange(e.target.value)}>
                <option value="">Выберите...</option>
                {assemblyPoints.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Дата прибытия</label>
              <input className={inp + (form.arrival_date ? '' : ' text-[#F8FAFC]/30')} type="date" value={form.arrival_date} onChange={e => set('arrival_date', e.target.value)} placeholder="Выберите дату" />
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Время прибытия</label>
              <input className={inp + (form.arrival_time ? '' : ' text-[#F8FAFC]/30')} type="time" value={form.arrival_time} onChange={e => set('arrival_time', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Состояние здоровья</label>
              <select className={inp} value={form.health_status} onChange={e => set('health_status', e.target.value)}>
                <option value="">Не указано</option>
                <option value="Без замечаний">Без замечаний</option>
                <option value="Ограничения/жалобы">Ограничения/жалобы</option>
              </select>
            </div>
            {form.health_status === 'Ограничения/жалобы' && (
              <div className="sm:col-span-2">
                <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Описание ограничений</label>
                <input className={inp} value={form.health_details} onChange={e => set('health_details', e.target.value)} placeholder="Укажите ограничения..." />
              </div>
            )}
          </div>

          {/* Логистика и согласование */}
          <div className="border-t border-[rgba(123,63,191,0.15)] pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-[#7B3FBF] font-bold uppercase tracking-widest">Логистика и согласование</div>
              {form.logistics_status && form.logistics_status !== 'none' && (
                <span className={`text-xs px-2 py-1 rounded ${LOGISTICS_STATUS[form.logistics_status]?.bg || ''} ${LOGISTICS_STATUS[form.logistics_status]?.color || ''}`}>
                  {LOGISTICS_STATUS[form.logistics_status]?.icon} {LOGISTICS_STATUS[form.logistics_status]?.label}
                </span>
              )}
            </div>
            {form.logistics_status === 'pending_admin' && form.proposed_assembly_point && (
              <div className="mb-3 p-3 rounded-lg bg-[#C9A84C]/8 border border-[#C9A84C]/20">
                <div className="text-xs text-[#C9A84C] font-bold mb-2">Предложено ({form.proposed_by || 'кандидатом'}):</div>
                <div className="text-xs text-[#F8FAFC]/60 space-y-0.5">
                  {form.proposed_assembly_point && <div>📍 Пункт сбора: {form.proposed_assembly_point}</div>}
                  {form.proposed_arrival_date && <div>📅 Дата: {form.proposed_arrival_date}</div>}
                  {form.proposed_arrival_time && <div>⏰ Время: {form.proposed_arrival_time}</div>}
                </div>
              </div>
            )}
            <div className="mb-3">
              <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Фото билета</label>
              {form.ticket_photo_url ? (
                <div className="flex items-center gap-2">
                  <a href={form.ticket_photo_url} target="_blank" rel="noreferrer" className="text-xs text-[#C9A84C] underline">Открыть билет</a>
                  <button type="button" onClick={() => set('ticket_photo_url', '')} className="text-xs text-red-400 hover:text-red-300">Удалить</button>
                </div>
              ) : (
                <label className="flex items-center gap-1.5 px-3 py-2 rounded border border-[rgba(123,63,191,0.3)] text-[#7B3FBF] hover:bg-[rgba(123,63,191,0.1)] text-xs cursor-pointer transition-all w-fit">
                  <Upload size={11} /> Загрузить фото билета
                  <input type="file" className="hidden" accept="image/*,.pdf"
                    onChange={async e => {
                      const file = e.target.files?.[0]; if (!file) return;
                      try { const url = await uploadWithRetry(file); set('ticket_photo_url', url); } catch (err) { alert('Ошибка загрузки: ' + err.message); }
                    }} />
                </label>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {form.logistics_status === 'none' && candidate?.id && (
                <>
                  <button type="button" onClick={() => {
                    set('proposed_assembly_point', form.assembly_point);
                    set('proposed_arrival_date', form.arrival_date);
                    set('proposed_arrival_time', form.arrival_time);
                    set('proposed_by', 'admin');
                    set('logistics_status', 'pending_candidate');
                  }} className="px-3 py-1.5 text-xs rounded border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all">
                    Отправить на согласование
                  </button>
                  <button type="button" onClick={() => {
                    set('logistics_status', 'confirmed');
                    set('logistics_confirmed_at', new Date().toISOString());
                  }} className="px-3 py-1.5 text-xs rounded border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all">
                    Утвердить без согласования
                  </button>
                </>
              )}
              {form.logistics_status === 'pending_admin' && (
                <>
                  <button type="button" onClick={() => {
                    set('assembly_point', form.proposed_assembly_point || form.assembly_point);
                    set('arrival_date', form.proposed_arrival_date || form.arrival_date);
                    set('arrival_time', form.proposed_arrival_time || form.arrival_time);
                    set('logistics_status', 'confirmed');
                    set('logistics_confirmed_at', new Date().toISOString());
                  }} className="px-3 py-1.5 text-xs rounded bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 transition-all">
                    ✓ Подтвердить предложенные данные
                  </button>
                  <button type="button" onClick={() => {
                    set('proposed_assembly_point', '');
                    set('proposed_arrival_date', '');
                    set('proposed_arrival_time', '');
                    set('proposed_by', '');
                    set('logistics_status', 'none');
                  }} className="px-3 py-1.5 text-xs rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                    Отклонить
                  </button>
                </>
              )}
              {form.logistics_status === 'pending_candidate' && (
                <button type="button" onClick={() => {
                  set('logistics_status', 'confirmed');
                  set('logistics_confirmed_at', new Date().toISOString());
                }} className="px-3 py-1.5 text-xs rounded bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 transition-all">
                  ✓ Подтвердить окончательно
                </button>
              )}
              {form.logistics_status === 'confirmed' && (
                <button type="button" onClick={() => { set('logistics_status', 'none'); set('logistics_confirmed_at', ''); }} className="px-3 py-1.5 text-xs rounded border border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/50 hover:text-[#F8FAFC] transition-all">
                  Пересогласовать
                </button>
              )}
            </div>
          </div>

          {/* Admin statuses — только для администратора */}
          {!isAgencyMode && (
            <div className="border-t border-[rgba(123,63,191,0.15)] pt-4">
              <div className="text-xs text-[#7B3FBF] font-bold uppercase tracking-widest mb-3">Статусы (только администратор)</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Проверка СБ</label>
                  <StatusDropdown
                    value={form.sb_check}
                    onChange={v => set('sb_check', v)}
                    options={SB_OPTIONS}
                    placeholder="Не указано"
                    allowEmpty
                    emptyLabel="Не указано"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Медкомиссия</label>
                  <StatusDropdown
                    value={form.medical_check}
                    onChange={v => set('medical_check', v)}
                    options={MED_OPTIONS}
                    placeholder="Не указано"
                    allowEmpty
                    emptyLabel="Не указано"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Основание для выплаты</label>
                  <select className={inp} value={form.payment_basis} onChange={e => set('payment_basis', e.target.value)}>
                    <option value="">Не указано</option>
                    <option>Готовится к отправке</option>
                    <option>Отказался от отправки</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">
                    Выплачено <span className="text-[#C9A84C]">({paymentAmount})</span>
                  </label>
                  <select className={inp} value={form.payment_made} onChange={e => set('payment_made', e.target.value)}>
                    <option value="">Не указано</option>
                    <option value="Нет">Нет</option>
                    <option value="Да">Да</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="block text-xs text-[#F8FAFC]/40 mb-1.5">Комментарий</label>
            <textarea 
              className={inp + ' resize-y min-h-[100px]'} 
              rows={4} 
              value={form.comment} 
              onChange={e => set('comment', e.target.value)} 
              placeholder="Комментарий..."
              disabled={candidate && !user} />
            {candidate && user && <p className="text-xs text-[#F8FAFC]/30 mt-1">От: {user.role === 'admin' ? 'Администратор' : user.role === 'moderator' ? 'Модератор' : 'Система'}</p>}
          </div>

          {/* Documents — типизированные слоты, сохраняются в анкету */}
          <div className="border-t border-[rgba(123,63,191,0.15)] pt-4">
            <div className="text-xs text-[#7B3FBF] font-bold uppercase tracking-widest mb-1">
              Документы кандидата {formDocs.length > 0 && <span className="text-[#F8FAFC]/40 normal-case font-normal">({formDocs.length} загружено)</span>}
            </div>
            <p className="text-xs text-[#F8FAFC]/40 mb-3">
              Сохраняются в анкете. Обязательные поля отмечены <span className="text-red-400">*</span>
            </p>
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

          {candidate?.id && (
            <div className="flex justify-start pt-2 border-t border-[rgba(123,63,191,0.15)]">
              <SbReportButton candidate={{ ...candidate, ...form }} formDocs={formDocs} candidateFormData={candidateFormData} />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-6 py-2.5 text-sm rounded-lg border border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/60 hover:text-[#F8FAFC] transition-all">Отмена</button>
            <button
              onClick={handleSaveClick}
              disabled={!!stopList || saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm rounded-lg bg-[#7B3FBF] text-white hover:bg-[#8B4FCF] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Сохранение...' : candidate ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>

        {activeTab === 'questionnaire' && candidate?.id && (
          <div className="p-6">
            <CandidateFormView candidateId={candidate.id} />
          </div>
        )}
      </div>
    </div>
  );
}
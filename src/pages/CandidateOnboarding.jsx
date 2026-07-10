import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle, AlertTriangle, Loader2, ExternalLink, ChevronDown, ChevronUp, Upload, X, MapPin, Calendar, Clock, RefreshCw, Info, Send } from 'lucide-react';
import { uploadWithRetry, validateFile } from '@/lib/uploadWithRetry';
import { compressImage } from '@/lib/imageCompress';
import CitySelect from '@/components/CitySelect';
import { getDocTypesForCitizenship, getMissingRequiredDocs } from '@/lib/docUtils';
import DocumentUploader from '@/components/candidate/DocumentUploader';
import DocumentLightbox from '@/components/candidate/DocumentLightbox';
import { CITIZENSHIPS, isCIS, LOGISTICS_STATUS } from '@/lib/candidateConstants';
import { notifyLogisticsChange } from '@/lib/notifyLogisticsChange';
import { logCandidateAction } from '@/lib/candidateLogger';
import { formatDate } from '@/lib/formatDate';
import MissionBlock from '@/components/candidate/MissionBlock';
import SbStatusBanner from '@/components/candidate/SbStatusBanner';
import OnboardingBackground from '@/components/candidate/OnboardingBackground';

const POSITIONS = ['Разнорабочий','Строитель','Водитель B','Водитель C','Водитель CE','Водитель D','Автослесарь','Медицинский работник','Охранник'];
const EDUCATION_LEVELS = ['Среднее','Среднее специальное','Неполное высшее','Высшее','Несколько высших'];
const FAMILY_STATUSES = ['Холост/Не замужем','Женат/Замужем','Разведён/Разведена','Вдовец/Вдова'];
const MILITARY_RANKS = ['Рядовой','Ефрейтор','Младший сержант','Сержант','Старший сержант','Старшина','Прапорщик','Офицер','Не служил'];

const SKILLS_BY_POSITION = {
  'Разнорабочий': ['Физическая выносливость','Работа с инструментом','Погрузо-разгрузочные работы','Уборка территории','Работа на высоте','Перенос тяжестей','Работа в команде'],
  'Строитель': ['Бетонные работы','Кирпичная кладка','Штукатурные работы','Работа с инструментом','Сварочные работы','Работа на высоте','Чтение чертежей','Арматурные работы','Опалубочные работы'],
  'Водитель B': ['Вождение легкового авто','Знание ПДД','Ориентирование на местности','Мелкий ремонт ТС','Работа с навигатором','Безаварийный стаж'],
  'Водитель C': ['Вождение грузовых авто','Знание ПДД','Такелажные работы','Оформление путевых листов','Мелкий ремонт ТС','Работа с тахографом'],
  'Водитель CE': ['Вождение авто с прицепом','Знание ПДД','Работа с тахографом','Управление полуприцепом','Мелкий ремонт ТС','Оформление путевых листов'],
  'Водитель D': ['Вождение автобуса','Знание ПДД','Работа с пассажирами','Оформление путевых листов','Работа с тахографом','Мелкий ремонт ТС'],
  'Автослесарь': ['Диагностика авто','Ремонт двигателя','Ремонт ходовой части','Сварочные работы','Работа с инструментом','Электрика авто','Шиномонтаж','Работа с документацией'],

  'Медицинский работник': ['Первая медицинская помощь','Введение инъекций','Перевязочные работы','Транспортировка пострадавших','Работа с медоборудованием','Ведение медицинской документации','Реанимационные мероприятия'],
  'Охранник': ['Охрана порядка','Физическая подготовка','Работа с оружием','Видеонаблюдение','Оформление документов','Работа в ЧС','Тактика охраны','Знание законодательства'],
};
const DEFAULT_SKILLS = ['Работа в команде','Физическая выносливость','Работа с документами','Знание ПК'];

const DOCS_READY = [
  'Паспорт РФ','Военный билет / приписное удостоверение',
  'СНИЛС','ИНН','Трудовая книжка','Медицинская книжка',
  'Водительское удостоверение','Диплом об образовании',
  'Свидетельства о допусках / сертификаты',
];

const EMPTY_FORM = {
  full_name: '', birth_date: '', birth_place: '', citizenship: 'РФ',
  registration_address: '', actual_address: '',
  passport_series: '', passport_number: '', passport_issued_by: '',
  passport_issued_date: '', passport_dept_code: '',
  phone: '', email: '', city: '', assembly_point: '', arrival_date: '',
  position: '',
  education_level: '', education_institution: '', education_specialty: '',
  graduation_year: '', additional_certs: '', skills: [],
  work_experience: '', shift_experience: '',
  health_notes: '', chronic_diseases: '', disabilities: '',
  family_status: '', children_count: '',
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
  military_rank: '', military_unit: '', military_specialty: '',
  has_criminal_record: '', criminal_record_details: '',
  salary_expectations: '', motivation: '',
  docs_ready: [], ready_to_start_date: '',
  consent_given: false,
  ticket_photo_url: '',
  logistics_status: 'none',
  arrival_time: '',
};

function prefillFromCandidate(cand) {
  const isPendingCandidate = cand?.logistics_status === 'pending_candidate';
  return {
    full_name: cand?.full_name || '',
    birth_date: cand?.birth_date || '',
    birth_place: cand?.birth_place || '',
    citizenship: cand?.citizenship || 'РФ',
    phone: cand?.phone || '',
    city: cand?.city || '',
    assembly_point: isPendingCandidate ? (cand?.proposed_assembly_point || cand?.assembly_point || '') : (cand?.assembly_point || ''),
    arrival_date: isPendingCandidate ? (cand?.proposed_arrival_date || cand?.arrival_date || '') : (cand?.arrival_date || ''),
    arrival_time: isPendingCandidate ? (cand?.proposed_arrival_time || cand?.arrival_time || '') : (cand?.arrival_time || ''),
    position: cand?.position || '',
    ticket_photo_url: cand?.ticket_photo_url || '',
    logistics_status: cand?.logistics_status || 'none',
  };
}

function prefillFromRecord(rec, cand) {
  return {
    full_name: rec.full_name || cand?.full_name || '',
    birth_date: rec.birth_date || cand?.birth_date || '',
    birth_place: rec.birth_place || cand?.birth_place || '',
    citizenship: rec.citizenship || cand?.citizenship || 'РФ',
    registration_address: rec.registration_address || '',
    actual_address: rec.actual_address || '',
    passport_series: rec.passport_series || '',
    passport_number: rec.passport_number || '',
    passport_issued_by: rec.passport_issued_by || '',
    passport_issued_date: rec.passport_issued_date || '',
    passport_dept_code: rec.passport_dept_code || '',
    phone: rec.phone || cand?.phone || '',
    email: rec.email || '',
    city: rec.city || cand?.city || '',
    assembly_point: cand?.assembly_point || rec.assembly_point || '',
    arrival_date: cand?.arrival_date || rec.arrival_date || '',
    position: rec.position || cand?.position || '',
    education_level: rec.education_level || '',
    education_institution: rec.education_institution || '',
    education_specialty: rec.education_specialty || '',
    graduation_year: rec.graduation_year || '',
    additional_certs: rec.additional_certs || '',
    skills: rec.skills || [],
    work_experience: rec.work_experience || '',
    shift_experience: rec.shift_experience || '',
    health_notes: rec.health_notes || cand?.health_details || '',
    chronic_diseases: rec.chronic_diseases || '',
    disabilities: rec.disabilities || '',
    family_status: rec.family_status || '',
    children_count: rec.children_count || '',
    emergency_contact_name: rec.emergency_contact_name || '',
    emergency_contact_phone: rec.emergency_contact_phone || '',
    emergency_contact_relation: rec.emergency_contact_relation || '',
    military_rank: rec.military_rank || '',
    military_unit: rec.military_unit || '',
    military_specialty: rec.military_specialty || '',
    has_criminal_record: rec.has_criminal_record || '',
    criminal_record_details: rec.criminal_record_details || '',
    salary_expectations: rec.salary_expectations || '',
    motivation: rec.motivation || '',
    docs_ready: rec.docs_ready || [],
    ready_to_start_date: rec.ready_to_start_date || '',
    consent_given: rec.consent_given || false,
    ticket_photo_url: cand?.ticket_photo_url || '',
    logistics_status: cand?.logistics_status || 'none',
    arrival_time: cand?.arrival_time || rec.arrival_time || '',
  };
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left bg-[#181818] border-b border-[#2a2a2a]">
        <span className="text-sm font-bold text-[#ccc] uppercase tracking-widest">{title}</span>
        {open ? <ChevronUp size={15} className="text-[#666]" /> : <ChevronDown size={15} className="text-[#666]" />}
      </button>
      {open && <div className="px-5 pb-5 pt-4 space-y-4">{children}</div>}
    </div>
  );
}

// Строгий чекбокс «то же самое»
function SameAsCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer mt-1.5 w-fit">
      <div onClick={onChange}
        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-[#555] border-[#888]' : 'border-[#444] bg-transparent hover:border-[#666]'}`}>
        {checked && <CheckCircle size={10} className="text-white" />}
      </div>
      <span className="text-xs text-[#666] select-none">{label}</span>
    </label>
  );
}

export default function CandidateOnboarding() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get('edit') === '1';

  const [formRecord, setFormRecord] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [birthPlaceSameAsCity, setBirthPlaceSameAsCity] = useState(false);
  const [actualSameAsReg, setActualSameAsReg] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadingDocType, setUploadingDocType] = useState(null);
  const [uploadErrors, setUploadErrors] = useState({});
  const [cityObject, setCityObject] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [curator, setCurator] = useState(null);

  // Устанавливаем заголовок страницы для корректного отображения в превью ссылок
  useEffect(() => {
    document.title = 'Анкета кандидата | БРО-СНБ';
  }, []);

  // Загрузка куратора точки сбора при подтверждённой логистике
  useEffect(() => {
    if (candidate?.logistics_status === 'confirmed' && candidate?.assembly_point) {
      base44.entities.City.filter({ name: candidate.assembly_point, is_assembly_point: true })
        .then(cities => {
          const c = cities[0];
          setCurator(c && (c.curator_name || c.curator_phone) ? { name: c.curator_name, phone: c.curator_phone } : null);
        })
        .catch(() => setCurator(null));
    } else {
      setCurator(null);
    }
  }, [candidate?.logistics_status, candidate?.assembly_point]);

  // Блокировка полей после проверки СБ — должно быть после объявления candidate
  const isSbVerified = candidate?.sb_check === 'Согласован';
  const isFieldLocked = (value) => isSbVerified && !!value;

  // Логистика доступна только после согласования СБ (или если админ уже предложил/подтвердил)
  const logisticsUnlocked = isSbVerified
    || candidate?.logistics_status === 'pending_candidate'
    || candidate?.logistics_status === 'confirmed';

  // Автопредзаполнение даты прибытия из «готов приступить» при согласовании СБ
  useEffect(() => {
    if (isSbVerified && !form.arrival_date && form.ready_to_start_date) {
      set('arrival_date', form.ready_to_start_date);
    }
  }, [isSbVerified]);

  // Realtime-подписка на изменения кандидата — мгновенное обновление логистики.
  // ВАЖНО: не перезаписываем поля формы, если кандидат активно редактирует анкету,
  // чтобы не сбивать ввод. Обновляем только при подтверждённой/предложенной логистике.
  useEffect(() => {
   if (!candidate?.id) return;
   const unsubscribe = base44.entities.Candidate.subscribe((event) => {
     if (event.data?.id !== candidate.id) return;
     const updated = event.data;
     setCandidate(updated);
     // Обновляем форму только если статус логистики — confirmed или pending_candidate
     // (т.е. данные пришли от администратора, а не от самого кандидата)
     const shouldSync = updated.logistics_status === 'confirmed' || updated.logistics_status === 'pending_candidate';
     if (shouldSync) {
       setForm(f => ({
         ...f,
         logistics_status: updated.logistics_status ?? f.logistics_status,
         assembly_point: updated.assembly_point ?? f.assembly_point,
         arrival_date: updated.arrival_date ?? f.arrival_date,
         arrival_time: updated.arrival_time ?? f.arrival_time,
         proposed_assembly_point: updated.proposed_assembly_point ?? f.proposed_assembly_point,
         proposed_arrival_date: updated.proposed_arrival_date ?? f.proposed_arrival_date,
         proposed_arrival_time: updated.proposed_arrival_time ?? f.proposed_arrival_time,
         ticket_photo_url: updated.ticket_photo_url ?? f.ticket_photo_url,
       }));
     }
   });
   return unsubscribe;
  }, [candidate?.id]);

  useEffect(() => {
    const loadForm = async () => {
      let records = await base44.entities.CandidateForm.filter({ form_token: token });
      if (!records.length) {
        // Auto-recover: CandidateForm record missing but Candidate has the token
        const cands = await base44.entities.Candidate.filter({ form_token: token });
        if (cands.length) {
          const cand = cands[0];
          const recovered = await base44.entities.CandidateForm.create({
            candidate_id: cand.id, form_token: token, status: 'pending',
          });
          records = [recovered];
        } else {
          setNotFound(true); setLoading(false); return;
        }
      }
      const rec = records[0];
      setFormRecord(rec);
      const cands = rec.candidate_id
        ? await base44.entities.Candidate.filter({ id: rec.candidate_id })
        : await base44.entities.Candidate.filter({ form_token: token });
      const cand = cands[0] || null;
      setCandidate(cand);
      if (rec.status === 'completed') {
        const filled = prefillFromRecord(rec, cand);
        setForm({ ...EMPTY_FORM, ...filled });
        if (rec.uploaded_docs?.length) setUploadedDocs(rec.uploaded_docs);
        if (filled.actual_address === filled.registration_address && filled.registration_address) setActualSameAsReg(true);
        if (filled.birth_place === filled.city && filled.city) setBirthPlaceSameAsCity(true);
        setIsEditing(editMode);
        setSubmitted(!editMode);
      } else {
        const filled = prefillFromCandidate(cand);
        setForm({ ...EMPTY_FORM, ...filled });
        setIsEditing(true);
      }
      setLoading(false);
    };
    loadForm();
  }, [token, editMode]);

  const toggleArr = (key, val) => setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(s => s !== val) : [...f[key], val] }));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleBirthPlaceSameToggle = () => {
    const next = !birthPlaceSameAsCity;
    setBirthPlaceSameAsCity(next);
    if (next) set('birth_place', form.city);
  };

  const handleActualSameToggle = () => {
    const next = !actualSameAsReg;
    setActualSameAsReg(next);
    if (next) set('actual_address', form.registration_address);
  };

  const currentSkills = SKILLS_BY_POSITION[form.position] || DEFAULT_SKILLS;

  // Типы документов импортируются из docUtils (ALL_DOC_TYPES)

  const handleDocUpload = async (docType, docLabel, file) => {
    if (!file) return;
    setUploadErrors(prev => ({ ...prev, [docType]: null }));
    const validationError = validateFile(file);
    if (validationError) { setUploadErrors(prev => ({ ...prev, [docType]: validationError })); return; }
    setUploadingDocType(docType);
    try {
      // Сжимаем изображение перед загрузкой — предотвращает "вылеты" в in-app браузерах мессенджеров
      const compressed = await compressImage(file);
      const file_url = await uploadWithRetry(compressed);
      const newDoc = { doc_type: docType, name: docLabel + ': ' + compressed.name, url: file_url, uploaded_at: new Date().toISOString() };
      setUploadedDocs(prev => {
        const filtered = prev.filter(d => d.doc_type !== docType);
        return [...filtered, newDoc];
      });
    } catch (e) {
      setUploadErrors(prev => ({ ...prev, [docType]: `Не удалось загрузить «${file.name}». Проверьте подключение.` }));
    }
    setUploadingDocType(null);
  };

  const removeDoc = (docType) => setUploadedDocs(prev => prev.filter(d => d.doc_type !== docType));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.consent_given) { alert('Необходимо дать согласие на обработку персональных данных'); return; }
    if (!form.full_name || !form.birth_date || !form.phone) {
      alert('Пожалуйста, заполните обязательные поля: ФИО, дату рождения, телефон'); return;
    }
    if (form.city && !cityObject && formRecord?.status !== 'completed') {
      alert('Пожалуйста, выберите населённый пункт из списка (введите и выберите из выпадающего списка).'); return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    const missingDocs = getMissingRequiredDocs(uploadedDocs, form.citizenship);
    const saveData = { ...form, uploaded_docs: uploadedDocs, consent_timestamp: now, submitted_at: now, status: 'completed' };
    await base44.entities.CandidateForm.update(formRecord.id, saveData);
    if (formRecord.candidate_id) {
      // Логистика: если кандидат указал свои данные и статус 'none' — переводим в pending_admin
      // Если логистика уже подтверждена, но кандидат изменил данные — сбрасываем в pending_admin
      let newLogisticsStatus = form.logistics_status;
      const oldLogistics = candidate?.logistics_status || 'none';

      if (oldLogistics === 'none' && form.assembly_point) {
        newLogisticsStatus = 'pending_admin';
      } else if (oldLogistics === 'confirmed') {
        // Проверяем, изменились ли поля логистики
        const logisticsChanged =
          String(candidate?.assembly_point || '') !== String(form.assembly_point || '') ||
          String(candidate?.arrival_date || '') !== String(form.arrival_date || '') ||
          String(candidate?.arrival_time || '') !== String(form.arrival_time || '');
        if (logisticsChanged) {
          newLogisticsStatus = 'pending_admin';
        }
      }

      // После проверки СБ заблокированные поля не перезаписываем
      const candidateUpdate = {
        phone: form.phone,
        email: form.email,
        city: form.city,
        position: form.position,
        arrival_date: form.arrival_date,
        arrival_time: form.arrival_time,
        assembly_point: form.assembly_point,
        ticket_photo_url: form.ticket_photo_url,
        logistics_status: newLogisticsStatus,
        logistics_confirmed_at: newLogisticsStatus === 'confirmed' ? now : undefined,
        health_details: form.health_notes,
        form_status: 'completed',
        form_submitted_at: now,
      };
      // Авто-перевод в статус "На проверке СБ" при наличии всех обязательных документов
      if (missingDocs.length === 0) {
        const currentSb = candidate?.sb_check || 'Не проверялся';
        if (currentSb === 'Не проверялся' || !currentSb) {
          candidateUpdate.sb_check = 'На проверке';
        }
      }
      if (!isSbVerified) {
        candidateUpdate.full_name = form.full_name;
        candidateUpdate.birth_date = form.birth_date;
        candidateUpdate.birth_place = form.birth_place;
        candidateUpdate.citizenship = form.citizenship;
      }
      await base44.entities.Candidate.update(formRecord.candidate_id, candidateUpdate);
      setCandidate(prev => ({ ...prev, ...candidateUpdate }));
      // Уведомляем админа при изменении логистики
      await notifyLogisticsChange(
        { ...candidate, id: formRecord.candidate_id, full_name: form.full_name, logistics_status: newLogisticsStatus, assembly_point: form.assembly_point, arrival_date: form.arrival_date, arrival_time: form.arrival_time, agency_id: candidate?.agency_id, agency_name: candidate?.agency_name },
        { ...candidate, logistics_status: oldLogistics },
        { name: form.full_name, role: 'candidate' }
      );
    }
    try {
      const agencyName = candidate?.agency_name || 'Агентство';
      const subject = `Анкета заполнена: ${form.full_name}`;
      const body = `Кандидат ${form.full_name} заполнил анкету.\n\nАгентство: ${agencyName}\nДолжность: ${form.position || '—'}\nТелефон: ${form.phone}\nEmail: ${form.email || '—'}\n\nПросмотреть: ${window.location.origin}/form/${token}?edit=1`;
      const emailPromises = [];
      if (candidate?.agency_id) {
        const agencies = await base44.entities.Agency.filter({ id: candidate.agency_id });
        if (agencies[0]?.email) emailPromises.push(base44.integrations.Core.SendEmail({ to: agencies[0].email, subject, body, from_name: 'БРО-СНБ' }));
        if (agencies[0]?.manager_email) emailPromises.push(base44.integrations.Core.SendEmail({ to: agencies[0].manager_email, subject, body, from_name: 'БРО-СНБ' }));
      }
      const admins = await base44.entities.User.filter({ role: 'admin' });
      admins.forEach(admin => { if (admin.email) emailPromises.push(base44.integrations.Core.SendEmail({ to: admin.email, subject, body, from_name: 'БРО-СНБ' })); });
      try {
        const moderators = await base44.entities.User.filter({ role: 'moderator' });
        moderators.forEach(mod => { if (mod.email) emailPromises.push(base44.integrations.Core.SendEmail({ to: mod.email, subject, body, from_name: 'БРО-СНБ' })); });
      } catch (_) {}
      if (form.email) {
        emailPromises.push(base44.integrations.Core.SendEmail({ to: form.email, subject: 'Анкета получена', body: `Здравствуйте, ${form.full_name}!\n\nВаша анкета получена и передана в кадровый отдел.\n\nДата: ${new Date().toLocaleString('ru-RU')}`, from_name: 'БРО-СНБ' }));
      }
      await Promise.allSettled(emailPromises);
      // Создаём in-app уведомление
      try {
        await base44.entities.Notification.create({
          agency_id: candidate?.agency_id || '',
          agency_name: candidate?.agency_name || '',
          candidate_id: formRecord.candidate_id || '',
          candidate_name: form.full_name,
          message: 'Анкета кандидата заполнена и отправлена',
          link: '/admin/candidates',
          is_read: false,
          category: 'form',
        });
      } catch (_) {}
    } catch (_) {}
    setFormRecord(prev => ({ ...prev, submitted_at: now, status: 'completed' }));
    if (missingDocs.length > 0) {
      setSubmitted(false);
      setIsEditing(true);
    } else {
      setSubmitted(true);
      setIsEditing(false);
    }
    setSubmitting(false);
  };

  const [logisticsAction, setLogisticsAction] = useState(null); // 'confirm' | 'reject' | null
  const [logisticsSaving, setLogisticsSaving] = useState(false);
  const [logisticsSaveNotice, setLogisticsSaveNotice] = useState(false);

  const handleLogisticsSave = async () => {
    if (!formRecord?.candidate_id) return;
    if (!form.assembly_point) { alert('Выберите пункт сбора'); return; }
    setLogisticsSaving(true);
    try {
      const now = new Date().toISOString();
      const oldLogistics = candidate?.logistics_status || 'none';
      const newStatus = oldLogistics === 'none' ? 'pending_admin' : oldLogistics;
      const update = {
        assembly_point: form.assembly_point,
        arrival_date: form.arrival_date,
        arrival_time: form.arrival_time,
        ticket_photo_url: form.ticket_photo_url,
        logistics_status: newStatus,
      };
      await base44.entities.Candidate.update(formRecord.candidate_id, update);
      setCandidate(prev => ({ ...prev, ...update }));
      set('logistics_status', newStatus);
      if (newStatus === 'pending_admin' && oldLogistics !== 'pending_admin') {
        await notifyLogisticsChange(
          { ...candidate, id: formRecord.candidate_id, ...update },
          { ...candidate, logistics_status: oldLogistics },
          { name: form.full_name, role: 'candidate' }
        );
      }
      setLogisticsSaveNotice(true);
      setTimeout(() => setLogisticsSaveNotice(false), 6000);
    } catch (e) {
      alert('Ошибка сохранения логистики. Попробуйте позже.');
    }
    setLogisticsSaving(false);
  };

  const handleLogisticsAction = async (action) => {
    if (!formRecord?.candidate_id) return;
    setLogisticsAction(action);
    try {
      const now = new Date().toISOString();
      if (action === 'confirm') {
        // Кандидат соглашается с предложением админа
        const confirmedAssembly = candidate.proposed_assembly_point || candidate.assembly_point;
        const confirmedDate = candidate.proposed_arrival_date || candidate.arrival_date;
        const confirmedTime = candidate.proposed_arrival_time || candidate.arrival_time;
        await base44.entities.Candidate.update(formRecord.candidate_id, {
          assembly_point: confirmedAssembly,
          arrival_date: confirmedDate,
          arrival_time: confirmedTime,
          logistics_status: 'confirmed',
          logistics_confirmed_at: now,
        });
        // Синхронизируем форму
        set('logistics_status', 'confirmed');
        set('assembly_point', confirmedAssembly);
        set('arrival_date', confirmedDate);
        set('arrival_time', confirmedTime);
        await notifyLogisticsChange(
          { ...candidate, id: formRecord.candidate_id, logistics_status: 'confirmed',
            assembly_point: candidate.proposed_assembly_point || candidate.assembly_point,
            arrival_date: candidate.proposed_arrival_date || candidate.arrival_date,
            arrival_time: candidate.proposed_arrival_time || candidate.arrival_time },
          { ...candidate, logistics_status: 'pending_candidate' },
          { name: form.full_name, role: 'candidate' }
        );
        // Обновляем локальное состояние кандидата
        const updatedCandidate = { ...candidate,
          logistics_status: 'confirmed',
          logistics_confirmed_at: now,
          assembly_point: candidate.proposed_assembly_point || candidate.assembly_point,
          arrival_date: candidate.proposed_arrival_date || candidate.arrival_date,
          arrival_time: candidate.proposed_arrival_time || candidate.arrival_time,
        };
        setCandidate(updatedCandidate);
        // Логируем действие кандидата
        await logCandidateAction({
          action: 'update',
          candidate: { ...updatedCandidate, id: formRecord.candidate_id },
          oldData: candidate,
          actor: { name: form.full_name, role: 'candidate' },
        });
      } else if (action === 'reject') {
        // Кандидат отклоняет и предлагает свои данные
        await base44.entities.Candidate.update(formRecord.candidate_id, {
          logistics_status: 'pending_admin',
          proposed_by: 'candidate',
        });
        // Синхронизируем форму
        set('logistics_status', 'pending_admin');
        await notifyLogisticsChange(
          { ...candidate, id: formRecord.candidate_id, logistics_status: 'pending_admin' },
          { ...candidate, logistics_status: 'pending_candidate' },
          { name: form.full_name, role: 'candidate' }
        );
        setCandidate(prev => ({ ...prev, logistics_status: 'pending_admin', proposed_by: 'candidate' }));
        // Логируем отклонение кандидатом
        await logCandidateAction({
          action: 'update',
          candidate: { ...candidate, id: formRecord.candidate_id, logistics_status: 'pending_admin', proposed_by: 'candidate' },
          oldData: candidate,
          actor: { name: form.full_name, role: 'candidate' },
        });
      }
    } catch (e) {
      alert('Ошибка при согласовании логистики. Попробуйте позже.');
    }
    setLogisticsAction(null);
  };

  // Совместимость со старым именем
  const logisticsConfirming = logisticsAction === 'confirm';
  const logisticsConfirmed = candidate?.logistics_status === 'confirmed';

  // Строгий рабочий стиль
  const inp = "w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2.5 text-sm text-[#e0e0e0] placeholder:text-[#444] focus:outline-none focus:border-[#666] transition-colors";
  const inpRO = "w-full bg-[#141414] border border-[#2a2a2a] rounded px-3 py-2.5 text-sm text-[#555] cursor-not-allowed";
  const lbl = "block text-xs font-semibold text-[#888] mb-1.5 uppercase tracking-wide";

  if (loading) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center relative">
      <OnboardingBackground />
      <Loader2 size={28} className="animate-spin text-[#666]" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 relative">
      <OnboardingBackground />
      <div className="text-center">
        <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-lg font-bold text-white mb-2">Анкета не найдена</h1>
        <p className="text-[#666] text-sm">Ссылка недействительна или устарела.</p>
      </div>
    </div>
  );

  if (submitted && !isEditing) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 relative">
      <OnboardingBackground />
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-green-900/40 border border-green-700/50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <SbStatusBanner sbCheck={candidate?.sb_check} candidateName={form.full_name} />
        <h1 className="text-xl font-bold text-white mb-3">Анкета отправлена</h1>
        <p className="text-[#888] text-sm leading-relaxed">
          Данные получены и переданы в кадровый отдел.<br />
          Согласие на обработку персональных данных подтверждено.
        </p>
        {formRecord?.submitted_at && (
          <p className="text-[#555] text-xs mt-4">Отправлено: {new Date(formRecord.submitted_at).toLocaleString('ru-RU')}</p>
        )}
        <div className="mt-5 flex items-center gap-2 justify-center">
          <button onClick={() => { setSubmitted(false); setIsEditing(true); }}
            className="px-5 py-2.5 rounded border border-[#333] text-sm text-[#888] hover:text-[#ccc] hover:border-[#555] transition-colors">
            {candidate?.sb_check === 'Согласован' ? 'Требуется действие' : 'Редактировать анкету'}
          </button>
          <button onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded border border-[#333] text-sm text-[#888] hover:text-[#ccc] hover:border-[#555] transition-colors flex items-center gap-1.5">
            <RefreshCw size={14} /> Обновить
          </button>
        </div>

        {/* Подтверждение логистики — если админ предложил, а анкета уже отправлена */}
        {candidate?.logistics_status === 'pending_candidate' && candidate?.proposed_assembly_point && !logisticsConfirmed && (
          <div className="mt-6 p-4 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/25 text-left">
            <p className="text-sm font-bold text-[#C9A84C] mb-3">📍 Администратор предложил логистику</p>
            <div className="text-xs text-[#ccc] space-y-1 mb-3">
              <div>Пункт сбора: <strong>{candidate.proposed_assembly_point}</strong></div>
              {candidate.proposed_arrival_date && <div>Дата: <strong>{formatDate(candidate.proposed_arrival_date)}</strong></div>}
              {candidate.proposed_arrival_time && <div>Время: <strong>{candidate.proposed_arrival_time}</strong></div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleLogisticsAction('confirm')} disabled={!!logisticsAction}
                className="flex-1 py-2.5 rounded bg-green-700/40 border border-green-600/50 text-sm text-green-300 hover:bg-green-700/60 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {logisticsAction === 'confirm' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {logisticsAction === 'confirm' ? 'Сохранение...' : '✓ Согласовать'}
              </button>
              <button onClick={() => handleLogisticsAction('reject')} disabled={!!logisticsAction}
                className="flex-1 py-2.5 rounded border border-[#444] text-sm text-[#888] hover:text-[#ccc] hover:border-[#666] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {logisticsAction === 'reject' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                {logisticsAction === 'reject' ? 'Сохранение...' : '✗ Отклонить'}
              </button>
            </div>
          </div>
        )}
        {logisticsConfirmed && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-green-900/25 to-green-800/10 border border-green-600/40 text-left">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
              <span className="text-sm font-bold text-green-400">Логистика согласована</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {candidate?.assembly_point && (
                <div className="flex items-center gap-2 text-[#ccc]">
                  <MapPin size={12} className="text-green-400/70" /> {candidate.assembly_point}
                </div>
              )}
              {candidate?.arrival_date && (
                <div className="flex items-center gap-2 text-[#ccc]">
                  <Calendar size={12} className="text-green-400/70" /> {formatDate(candidate.arrival_date)}
                </div>
              )}
              {candidate?.arrival_time && (
                <div className="flex items-center gap-2 text-[#ccc]">
                  <Clock size={12} className="text-green-400/70" /> {candidate.arrival_time}
                </div>
              )}
            </div>
          </div>
        )}
        {curator && (
          <div className="mt-3 p-4 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/25 text-left">
            <p className="text-sm font-bold text-[#C9A84C] mb-2">👤 Ваш куратор</p>
            {curator.name && <p className="text-sm text-[#F8FAFC] font-semibold mb-1">{curator.name}</p>}
            {curator.phone && <p className="text-xl text-[#C9A84C] font-bold tracking-wide">{curator.phone}</p>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-[#e0e0e0] py-8 px-4 relative">
      <OnboardingBackground />
      <div className="max-w-2xl mx-auto">
        {/* Шапка */}
        <div className="mb-8 pb-6 border-b border-[#222]">
          <div className="flex items-center gap-3 mb-3">
            <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png"
              className="w-9 h-9 object-contain" alt="logo" />
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Анкета кандидата</h1>
              <p className="text-[#555] text-xs">ООО «БРО-СНБ» · Программа восстановления ЛНР и ДНР</p>
            </div>
          </div>
          {candidate?.agency_name && (
            <p className="text-[#666] text-sm">Агентство: <span className="text-[#aaa]">{candidate.agency_name}</span></p>
          )}
          {formRecord?.status === 'completed' && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded border border-green-800/60 bg-green-900/20 text-xs text-green-500">
              <CheckCircle size={11} /> Анкета заполнена — режим редактирования
            </div>
          )}
        </div>

        {/* Уведомление о нехватке документов — только после отправки анкеты (Этап 2) */}
        {formRecord?.status === 'completed' && (() => {
          const missing = getMissingRequiredDocs(uploadedDocs, form.citizenship);
          if (missing.length === 0) return null;
          return (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-900/20 border border-red-800/40 text-xs text-red-400">
              <AlertTriangle size={14} className="flex-shrink-0" />
              <span>Не загружено обязательных документов: {missing.length} из 3 — {missing.map(d => d.label).join(', ')}</span>
            </div>
          );
        })()}

        {/* Приветственный блок с миссией */}
        <MissionBlock />

        {/* Индикатор статуса проверки СБ — только после отправки анкеты (Этап 2+) */}
        {formRecord?.status === 'completed' && <SbStatusBanner sbCheck={candidate?.sb_check} candidateName={form.full_name} />}

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* БЛОК ЛОГИСТИКИ — только после прохождения проверки СБ (Этап 3) */}
          <div className="bg-[#161616] border border-[#C9A84C]/30 rounded-lg p-4 space-y-3" hidden={!isSbVerified}>
            {/* Информационный блок — скрывается после подтверждения логистики */}
            {form.logistics_status !== 'confirmed' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#C9A84C]/5 border border-[#C9A84C]/15">
              <Info size={14} className="text-[#C9A84C] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#888] leading-relaxed">
                Укажите пункт сбора и дату прибытия. После отправки анкеты данные передаются администратору на согласование.
                Если администратор предложит другие даты — вы увидите их здесь и сможете согласовать или отклонить.
              </p>
            </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#C9A84C] uppercase tracking-wide font-bold">📍 Логистика</p>
              {form.logistics_status && form.logistics_status !== 'none' && (
                <span className={`text-xs px-2 py-0.5 rounded ${LOGISTICS_STATUS[form.logistics_status]?.bg || ''} ${LOGISTICS_STATUS[form.logistics_status]?.color || ''}`}>
                  {LOGISTICS_STATUS[form.logistics_status]?.icon} {LOGISTICS_STATUS[form.logistics_status]?.label}
                </span>
              )}
            </div>

            {/* Предложение администратора — ждёт ответа кандидата */}
            {form.logistics_status === 'pending_candidate' && candidate?.proposed_assembly_point && (
              <div className="p-3 rounded-lg bg-[#C9A84C]/8 border border-[#C9A84C]/20">
                <p className="text-xs text-[#C9A84C] font-bold mb-2">Администратор предложил:</p>
                <div className="text-xs text-[#e0e0e0] space-y-0.5 mb-3">
                  <div>Пункт сбора: <strong>{candidate.proposed_assembly_point}</strong></div>
                  {candidate.proposed_arrival_date && <div>Дата: <strong>{formatDate(candidate.proposed_arrival_date)}</strong></div>}
                  {candidate.proposed_arrival_time && <div>Время: <strong>{candidate.proposed_arrival_time}</strong></div>}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleLogisticsAction('confirm')} disabled={!!logisticsAction}
                    className="flex-1 py-2 rounded bg-green-900/30 border border-green-700/50 text-xs text-green-400 hover:bg-green-900/50 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {logisticsAction === 'confirm' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    {logisticsAction === 'confirm' ? 'Сохранение...' : 'Согласовать'}
                  </button>
                  <button type="button" onClick={() => handleLogisticsAction('reject')} disabled={!!logisticsAction}
                    className="flex-1 py-2 rounded border border-[#444] text-xs text-[#888] hover:text-[#ccc] hover:border-[#666] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {logisticsAction === 'reject' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    Отклонить и указать свои
                  </button>
                </div>
              </div>
            )}

            {/* Подтверждено — данные берём из candidate (источник истины), а не из form */}
            {form.logistics_status === 'confirmed' && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-900/25 to-green-800/10 border border-green-600/40">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                    <CheckCircle size={15} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-400">Логистика согласована</p>
                    <p className="text-[10px] text-green-500/60">Вы едете на работу! Данные утверждены администратором.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {candidate?.assembly_point && (
                    <div className="flex items-center gap-2 text-[#e0e0e0]">
                      <MapPin size={13} className="text-green-400/70 flex-shrink-0" />
                      <span className="text-[#888] text-xs">Пункт сбора:</span>
                      <span className="font-semibold">{candidate.assembly_point}</span>
                    </div>
                  )}
                  {candidate?.arrival_date && (
                    <div className="flex items-center gap-2 text-[#e0e0e0]">
                      <Calendar size={13} className="text-green-400/70 flex-shrink-0" />
                      <span className="text-[#888] text-xs">Дата прибытия:</span>
                      <span className="font-semibold">{formatDate(candidate.arrival_date)}</span>
                    </div>
                  )}
                  {candidate?.arrival_time && (
                    <div className="flex items-center gap-2 text-[#e0e0e0]">
                      <Clock size={13} className="text-green-400/70 flex-shrink-0" />
                      <span className="text-[#888] text-xs">Время:</span>
                      <span className="font-semibold">{candidate.arrival_time}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-green-500/50 mt-3 pt-2 border-t border-green-700/20">
                  Изменения возможны только через администратора.
                </p>
              </div>
            )}

            {/* Куратор точки сбора */}
            {curator && (
              <div className="p-3 rounded-lg bg-[#C9A84C]/8 border border-[#C9A84C]/20">
                <p className="text-xs text-[#C9A84C] font-bold mb-1">👤 Ваш куратор</p>
                {curator.name && <p className="text-sm text-[#F8FAFC] font-semibold">{curator.name}</p>}
                {curator.phone && <p className="text-lg text-[#C9A84C] font-bold tracking-wide">{curator.phone}</p>}
              </div>
            )}

            {/* Поля ввода — только после согласования СБ */}
            {logisticsUnlocked && form.logistics_status !== 'pending_candidate' && form.logistics_status !== 'confirmed' && (
              <>
                <div>
                  <label className={lbl}>Пункт сбора</label>
                  <CitySelect
                    value={form.assembly_point}
                    onChange={val => set('assembly_point', val)}
                    inputClassName={inp}
                    placeholder="Выберите город..."
                    assemblyPointsOnly
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Дата прибытия</label>
                    <input className={inp + (form.arrival_date ? '' : ' text-[#555]')} type="date" value={form.arrival_date} onChange={e => set('arrival_date', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Время прибытия</label>
                    <input className={inp + (form.arrival_time ? '' : ' text-[#555]')} type="time" value={form.arrival_time} onChange={e => set('arrival_time', e.target.value)} />
                  </div>
                </div>
                {form.logistics_status === 'none' && form.assembly_point && (
                  <p className="text-xs text-[#555]">После отправки анкеты данные будут переданы на согласование администратору.</p>
                )}
                {form.logistics_status === 'pending_admin' && (
                  <p className="text-xs text-[#C9A84C]/70">⏳ Данные переданы администратору. Ожидайте согласования.</p>
                )}
              </>
            )}

            {/* Кнопка сохранения логистики */}
            {logisticsUnlocked && form.logistics_status !== 'pending_candidate' && form.logistics_status !== 'confirmed' && (
              <button type="button" onClick={handleLogisticsSave} disabled={logisticsSaving}
                className="w-full py-2.5 rounded bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-sm text-[#C9A84C] hover:bg-[#C9A84C]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-bold">
                {logisticsSaving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {logisticsSaving ? 'Сохранение...' : 'Отправить данные на согласование'}
              </button>
            )}
            {logisticsSaveNotice && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-900/20 border border-green-700/40 text-xs text-green-400">
                <CheckCircle size={14} className="flex-shrink-0" />
                Данные логистики переданы администратору на согласование. Ожидайте подтверждения.
              </div>
            )}

            {/* Загрузка фото билета — только после СБ */}
            {logisticsUnlocked && (
            <div className="pt-2 border-t border-[#2a2a2a]">
              <label className={lbl}>Фото билета (если есть)</label>
              {form.ticket_photo_url ? (
                <div className="flex items-center gap-2">
                  <a href={form.ticket_photo_url} target="_blank" rel="noreferrer" className="text-xs text-[#C9A84C] underline">Открыть билет</a>
                  <button type="button" onClick={() => set('ticket_photo_url', '')} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-0.5">
                    <X size={11} /> Удалить
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-1.5 px-3 py-2 rounded border border-[#333] text-[#666] hover:text-[#aaa] hover:border-[#555] text-xs cursor-pointer transition-colors w-fit">
                  <Upload size={11} /> Загрузить фото билета
                  <input type="file" className="hidden" accept="image/*,.pdf"
                    onChange={async e => {
                      const file = e.target.files?.[0]; if (!file) return;
                      try {
                        const compressed = await compressImage(file);
                        const url = await uploadWithRetry(compressed);
                        set('ticket_photo_url', url);
                      } catch (err) { alert('Ошибка загрузки: ' + err.message); }
                    }} />
                </label>
              )}
            </div>
            )}
          </div>

          {/* РАЗДЕЛ 1 */}
          <Section title="Раздел 1. Персональные данные">
            <div>
              <label className={lbl}>ФИО <span className="text-red-500">*</span> {isFieldLocked(form.full_name) && <span className="text-[#C9A84C] normal-case">🔒 Проверено СБ</span>}</label>
              <input className={isFieldLocked(form.full_name) ? inpRO : inp} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Иванов Иван Иванович" readOnly={isFieldLocked(form.full_name)} autoComplete="off" autoCorrect="off" spellCheck={false} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Дата рождения <span className="text-red-500">*</span></label>
                <input className={(isFieldLocked(form.birth_date) ? inpRO : inp) + (form.birth_date ? '' : ' text-[#555]')} type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} readOnly={isFieldLocked(form.birth_date)} required />
              </div>
              <div>
                <label className={lbl}>Гражданство {isFieldLocked(form.citizenship) && <span className="text-[#C9A84C] normal-case">🔒</span>}</label>
                <select className={isFieldLocked(form.citizenship) ? inpRO : inp} value={form.citizenship} onChange={e => set('citizenship', e.target.value)} disabled={isFieldLocked(form.citizenship)}>
                  {CITIZENSHIPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Город проживания — первый, чтобы на него можно было сослаться */}
            <div>
              <label className={lbl}>Город проживания</label>
              <CitySelect
                value={form.city}
                onChange={val => { set('city', val); if (birthPlaceSameAsCity) set('birth_place', val); }}
                onCitySelect={setCityObject}
                inputClassName={inp}
                placeholder="г. Хабаровск"
              />
            </div>

            <div>
              <label className={lbl}>Место рождения {isFieldLocked(form.birth_place) && <span className="text-[#C9A84C] normal-case">🔒</span>}</label>
              <input className={isFieldLocked(form.birth_place) ? inpRO : inp} value={form.birth_place}
                onChange={e => { set('birth_place', e.target.value); setBirthPlaceSameAsCity(false); }}
                placeholder="г. Москва"
                disabled={birthPlaceSameAsCity || isFieldLocked(form.birth_place)} />
              <SameAsCheckbox label="Совпадает с городом проживания" checked={birthPlaceSameAsCity} onChange={handleBirthPlaceSameToggle} />
            </div>

            <div>
              <label className={lbl}>Адрес регистрации (прописка)</label>
              <input className={inp} value={form.registration_address}
                onChange={e => { set('registration_address', e.target.value); if (actualSameAsReg) set('actual_address', e.target.value); }}
                placeholder="г. Хабаровск, ул. Примерная, д. 1, кв. 1" />
            </div>
            <div>
              <label className={lbl}>Фактический адрес проживания</label>
              <input className={inp} value={form.actual_address}
                onChange={e => { set('actual_address', e.target.value); setActualSameAsReg(false); }}
                placeholder="Если отличается от прописки"
                disabled={actualSameAsReg} />
              <SameAsCheckbox label="Совпадает с адресом регистрации" checked={actualSameAsReg} onChange={handleActualSameToggle} />
            </div>

            {/* Паспорт */}
            <div className="pt-3 border-t border-[#222]">
              <p className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-3">Паспорт гражданина РФ</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className={lbl}>Серия {isFieldLocked(form.passport_series) && <span className="text-[#C9A84C] normal-case">🔒</span>}</label>
                   <input className={isFieldLocked(form.passport_series) ? inpRO : inp} value={form.passport_series} onChange={e => set('passport_series', e.target.value)} placeholder="1234" readOnly={isFieldLocked(form.passport_series)} />
                 </div>
                 <div>
                   <label className={lbl}>Номер {isFieldLocked(form.passport_number) && <span className="text-[#C9A84C] normal-case">🔒</span>}</label>
                   <input className={isFieldLocked(form.passport_number) ? inpRO : inp} value={form.passport_number} onChange={e => set('passport_number', e.target.value)} placeholder="567890" readOnly={isFieldLocked(form.passport_number)} />
                 </div>
                 <div className="col-span-2">
                   <label className={lbl}>Кем выдан {isFieldLocked(form.passport_issued_by) && <span className="text-[#C9A84C] normal-case">🔒</span>}</label>
                   <input className={isFieldLocked(form.passport_issued_by) ? inpRO : inp} value={form.passport_issued_by} onChange={e => set('passport_issued_by', e.target.value)} placeholder="МВД России по г. Москва" readOnly={isFieldLocked(form.passport_issued_by)} />
                 </div>
                 <div>
                   <label className={lbl}>Дата выдачи {isFieldLocked(form.passport_issued_date) && <span className="text-[#C9A84C] normal-case">🔒</span>}</label>
                   <input className={(isFieldLocked(form.passport_issued_date) ? inpRO : inp) + (form.passport_issued_date ? '' : ' text-[#555]')} type="date" value={form.passport_issued_date} onChange={e => set('passport_issued_date', e.target.value)} readOnly={isFieldLocked(form.passport_issued_date)} />
                 </div>
                 <div>
                   <label className={lbl}>Код подразделения {isFieldLocked(form.passport_dept_code) && <span className="text-[#C9A84C] normal-case">🔒</span>}</label>
                   <input className={isFieldLocked(form.passport_dept_code) ? inpRO : inp} value={form.passport_dept_code} onChange={e => set('passport_dept_code', e.target.value)} placeholder="770-001" readOnly={isFieldLocked(form.passport_dept_code)} />
                 </div>
              </div>
            </div>

            {/* Контакты */}
            <div className="pt-3 border-t border-[#222]">
              <p className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-3">Контактные данные</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Телефон <span className="text-red-500">*</span></label>
                  <input className={inp} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 (___) ___-__-__" required />
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="example@mail.ru" />
                </div>
              </div>
            </div>
          </Section>

          {/* РАЗДЕЛ 2 */}
          <Section title="Раздел 2. Специализация и квалификация">
            <div>
              <label className={lbl}>Желаемая должность</label>
              <select className={inp} value={form.position} onChange={e => { set('position', e.target.value); set('skills', []); }}>
                <option value="">Выберите должность...</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Уровень образования</label>
                <select className={inp} value={form.education_level} onChange={e => set('education_level', e.target.value)}>
                  <option value="">Выберите...</option>
                  {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Год окончания</label>
                <input className={inp} value={form.graduation_year} onChange={e => set('graduation_year', e.target.value)} placeholder="2010" />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Учебное заведение</label>
                <input className={inp} value={form.education_institution} onChange={e => set('education_institution', e.target.value)} placeholder="ДВГТУ, г. Владивосток" />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Специальность по диплому</label>
                <input className={inp} value={form.education_specialty} onChange={e => set('education_specialty', e.target.value)} placeholder="Строительство зданий и сооружений" />
              </div>
            </div>
            <div>
              <label className={lbl}>Дополнительные допуски и сертификаты</label>
              <textarea className={inp + ' resize-none'} rows={2} value={form.additional_certs} onChange={e => set('additional_certs', e.target.value)} placeholder="Удостоверение сварщика, права категории C, допуск к работе на высоте..." />
            </div>
            <div>
              <label className={lbl}>Профессиональные навыки{form.position ? ` — ${form.position}` : ''}</label>
              {!form.position && <p className="text-xs text-[#555] mb-2">Выберите должность для персонализированного списка</p>}
              <div className="flex flex-wrap gap-2 mt-1">
                {currentSkills.map(skill => (
                  <button key={skill} type="button" onClick={() => toggleArr('skills', skill)}
                    className={`px-3 py-1.5 rounded text-xs transition-colors border ${form.skills.includes(skill) ? 'bg-[#333] border-[#555] text-white' : 'bg-transparent border-[#2a2a2a] text-[#666] hover:border-[#444] hover:text-[#999]'}`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* РАЗДЕЛ 3 */}
          <Section title="Раздел 3. Опыт работы вахтовым методом">
            <div>
              <label className={lbl}>Общий опыт работы</label>
              <textarea className={inp + ' resize-none'} rows={4} value={form.work_experience} onChange={e => set('work_experience', e.target.value)} placeholder="Укажите последние места работы: организация, должность, период, причина увольнения..." />
            </div>
            <div>
              <label className={lbl}>Опыт работы вахтовым методом</label>
              <textarea className={inp + ' resize-none'} rows={2} value={form.shift_experience} onChange={e => set('shift_experience', e.target.value)} placeholder="Регион, объект, продолжительность вахты, работодатель..." />
            </div>
          </Section>

          {/* РАЗДЕЛ 4 */}
          <Section title="Раздел 4. Состояние здоровья" defaultOpen={false}>
            <div>
              <label className={lbl}>Хронические заболевания</label>
              <input className={inp} value={form.chronic_diseases} onChange={e => set('chronic_diseases', e.target.value)} placeholder="Нет / перечислите при наличии" />
            </div>
            <div>
              <label className={lbl}>Инвалидность / ограничения по здоровью</label>
              <input className={inp} value={form.disabilities} onChange={e => set('disabilities', e.target.value)} placeholder="Нет / укажите при наличии" />
            </div>
            <div>
              <label className={lbl}>Дополнительные сведения</label>
              <textarea className={inp + ' resize-none'} rows={2} value={form.health_notes} onChange={e => set('health_notes', e.target.value)} placeholder="Аллергии, особые требования к условиям труда..." />
            </div>
          </Section>

          {/* РАЗДЕЛ 5 */}
          <Section title="Раздел 5. Семья и близкие" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Семейное положение</label>
                <select className={inp} value={form.family_status} onChange={e => set('family_status', e.target.value)}>
                  <option value="">Выберите...</option>
                  {FAMILY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Количество детей</label>
                <input className={inp} type="number" min="0" value={form.children_count} onChange={e => set('children_count', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="pt-3 border-t border-[#222]">
              <p className="text-xs text-[#666] mb-3">Контактное лицо на случай экстренной связи</p>
              <div className="space-y-3">
                <div>
                  <label className={lbl}>ФИО</label>
                  <input className={inp} value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Иванова Мария Ивановна" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Телефон</label>
                    <input className={inp} type="tel" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} placeholder="+7 ___" />
                  </div>
                  <div>
                    <label className={lbl}>Степень родства</label>
                    <input className={inp} value={form.emergency_contact_relation} onChange={e => set('emergency_contact_relation', e.target.value)} placeholder="Супруга, мать..." />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* РАЗДЕЛ 6 */}
          <Section title="Раздел 6. Воинский учёт (для мужчин)" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Воинское звание</label>
                <select className={inp} value={form.military_rank} onChange={e => set('military_rank', e.target.value)}>
                  <option value="">Выберите...</option>
                  {MILITARY_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Военная специальность</label>
                <input className={inp} value={form.military_specialty} onChange={e => set('military_specialty', e.target.value)} placeholder="ВУС 100" />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Воинская часть / место службы</label>
                <input className={inp} value={form.military_unit} onChange={e => set('military_unit', e.target.value)} placeholder="В/ч 12345, г. Хабаровск" />
              </div>
            </div>
          </Section>

          {/* РАЗДЕЛ 7 */}
          <Section title="Раздел 7. Судимость" defaultOpen={false}>
            <div>
              <label className={lbl}>Наличие судимостей</label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {['Нет','Да, погашена','Да, действующая'].map(opt => (
                  <button key={opt} type="button" onClick={() => set('has_criminal_record', opt)}
                    className={`flex-1 min-w-[90px] py-2.5 rounded text-sm border transition-colors ${form.has_criminal_record === opt ? 'bg-[#2a2a2a] border-[#555] text-white' : 'bg-transparent border-[#222] text-[#666] hover:border-[#444]'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {form.has_criminal_record && form.has_criminal_record !== 'Нет' && (
              <div>
                <label className={lbl}>Подробности</label>
                <textarea className={inp + ' resize-none'} rows={2} value={form.criminal_record_details} onChange={e => set('criminal_record_details', e.target.value)} placeholder="Статья, год, срок..." />
              </div>
            )}
          </Section>

          {/* РАЗДЕЛ 8 */}
          <Section title="Раздел 8. Мотивация и ожидания" defaultOpen={false}>
            <div>
              <label className={lbl}>Ожидаемая заработная плата</label>
              <input className={inp} value={form.salary_expectations} onChange={e => set('salary_expectations', e.target.value)} placeholder="от 300 000 ₽ / мес." />
            </div>
            <div>
              <label className={lbl}>Мотивация / почему хотите участвовать в программе</label>
              <textarea className={inp + ' resize-none'} rows={3} value={form.motivation} onChange={e => set('motivation', e.target.value)} placeholder="Опишите вашу мотивацию..." />
            </div>
          </Section>

          {/* РАЗДЕЛ 9 */}
          <Section title="Раздел 9. Готовность документов" defaultOpen={false}>
            <div>
              <label className={lbl}>Имеющиеся документы (отметьте)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DOCS_READY.map(doc => (
                  <button key={doc} type="button" onClick={() => toggleArr('docs_ready', doc)}
                    className={`px-3 py-1.5 rounded text-xs transition-colors border ${form.docs_ready.includes(doc) ? 'bg-[#2a2a2a] border-[#555] text-white' : 'bg-transparent border-[#222] text-[#666] hover:border-[#444] hover:text-[#999]'}`}>
                    {doc}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={lbl}>Готов приступить к работе с</label>
              <input className={inp + (form.ready_to_start_date ? '' : ' text-[#F8FAFC]/30')} type="date" value={form.ready_to_start_date} onChange={e => set('ready_to_start_date', e.target.value)} />
            </div>
          </Section>

          {/* РАЗДЕЛ 10: Загрузка документов */}
          <Section title="Раздел 10. Загрузка документов" defaultOpen={false}>
            <p className="text-xs text-[#666] leading-relaxed mb-3">
              Загрузите сканы или фотографии документов. Можно перетащить файл в нужное поле или нажать для выбора.
              Большие фото сжимаются автоматически. Форматы: JPG, PNG, PDF, HEIC.
              Обязательные документы отмечены <span className="text-red-500">*</span>
            </p>
            <DocumentUploader
              docTypes={getDocTypesForCitizenship(form.citizenship)}
              uploadedDocs={uploadedDocs}
              onUpload={handleDocUpload}
              onRemove={removeDoc}
              uploadingDocType={uploadingDocType}
              uploadErrors={uploadErrors}
              onView={(doc) => {
                const idx = uploadedDocs.findIndex(d => d.url === doc.url);
                if (idx >= 0) setLightboxIndex(idx);
              }}
            />
          </Section>

          {/* РАЗДЕЛ 11 */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-5">
            <h2 className="text-sm font-bold text-[#aaa] uppercase tracking-widest mb-3">Раздел 11. Подпись и согласие</h2>
            <p className="text-xs text-[#666] leading-relaxed mb-3">
              Подтверждаю достоверность указанных данных. Даю согласие на обработку персональных данных
              в соответствии с Федеральным законом №152-ФЗ «О персональных данных».
            </p>
            <a href="/consent" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#666] hover:text-[#aaa] underline mb-4 transition-colors">
              <ExternalLink size={11} /> Полный текст согласия на обработку ПДн
            </a>
            <label className="flex items-start gap-3 cursor-pointer mt-3" onClick={() => set('consent_given', !form.consent_given)}>
              <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${form.consent_given ? 'bg-[#555] border-[#888]' : 'border-[#444] hover:border-[#666]'}`}>
                {form.consent_given && <CheckCircle size={11} className="text-white" />}
              </div>
              <span className="text-sm text-[#888] leading-relaxed">
                <strong className="text-[#ccc]">Согласен(а)</strong> на обработку персональных данных.
                Все указанные сведения достоверны.
              </span>
            </label>
          </div>

          <button type="submit" disabled={submitting || !form.consent_given}
            className="w-full py-3.5 rounded bg-[#333] text-white font-bold text-sm hover:bg-[#444] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-[#444]">
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> Сохранение...</>
              : formRecord?.status === 'completed' ? 'Сохранить изменения' : 'Подписать и отправить анкету'}
          </button>
          <p className="text-center text-xs text-[#444] pb-4">* — обязательные для заполнения поля</p>
        </form>

        {lightboxIndex !== null && uploadedDocs.length > 0 && (
          <DocumentLightbox
            docs={uploadedDocs}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </div>
    </div>
  );
}
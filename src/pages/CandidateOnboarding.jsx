import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle, Loader2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const POSITIONS = ['Разнорабочий','Строитель','Водитель B','Водитель C','Водитель CE','Водитель D','Автослесарь','Инженер связи','Оператор БПЛА','Взрывотехник','Медицинский работник','Охранник'];

const EDUCATION_LEVELS = ['Среднее','Среднее специальное','Неполное высшее','Высшее','Несколько высших'];
const FAMILY_STATUSES = ['Холост/Не замужем','Женат/Замужем','Разведён/Разведена','Вдовец/Вдова'];
const MILITARY_RANKS = ['Рядовой','Ефрейтор','Младший сержант','Сержант','Старший сержант','Старшина','Прапорщик','Офицер','Не служил'];

const SKILLS_LIST = [
  'Работа с инструментом','Сварочные работы','Вождение грузовых авто',
  'Электромонтаж','Погрузо-разгрузочные работы','Работа на высоте',
  'Знание ПК','Охрана порядка','Медицинская помощь','Управление БПЛА',
  'Взрывные работы','Работа с документами',
];

const DOCS_READY = [
  'Паспорт РФ','Военный билет / приписное удостоверение',
  'СНИЛС','ИНН','Трудовая книжка','Медицинская книжка',
  'Водительское удостоверение','Диплом об образовании',
  'Свидетельства о допусках / сертификаты',
];

const EMPTY_FORM = {
  // Раздел 1: Персональные данные
  full_name: '',
  birth_date: '',
  birth_place: '',
  citizenship: 'РФ',
  registration_address: '',
  actual_address: '',
  // Паспорт
  passport_series: '',
  passport_number: '',
  passport_issued_by: '',
  passport_issued_date: '',
  passport_dept_code: '',
  // Контакты
  phone: '',
  email: '',
  // Раздел 2: Специализация
  position: '',
  education_level: '',
  education_institution: '',
  education_specialty: '',
  graduation_year: '',
  additional_certs: '',
  skills: [],
  // Раздел 3: Опыт
  work_experience: '',
  shift_experience: '',
  // Раздел 4: Здоровье
  health_notes: '',
  chronic_diseases: '',
  disabilities: '',
  // Раздел 5: Семья
  family_status: '',
  children_count: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relation: '',
  // Раздел 6: Воинский учёт
  military_rank: '',
  military_unit: '',
  military_specialty: '',
  // Раздел 7: Судимость
  has_criminal_record: '',
  criminal_record_details: '',
  // Раздел 8: Мотивация
  salary_expectations: '',
  motivation: '',
  // Раздел 9: Готовность документов
  docs_ready: [],
  ready_to_start_date: '',
  // Согласие
  consent_given: false,
};

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-sm font-bold text-[#7B3FBF] uppercase tracking-widest">{title}</span>
        {open ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
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

  useEffect(() => {
    const loadForm = async () => {
      const records = await base44.entities.CandidateForm.filter({ form_token: token });
      if (!records.length) { setNotFound(true); setLoading(false); return; }
      const rec = records[0];
      setFormRecord(rec);

      const cands = await base44.entities.Candidate.filter({ id: rec.candidate_id });
      const cand = cands[0] || null;
      setCandidate(cand);

      if (rec.status === 'completed') {
        // Pre-fill from saved form data
        setForm(f => ({
          ...EMPTY_FORM,
          full_name: rec.full_name || cand?.full_name || '',
          birth_date: rec.birth_date || cand?.birth_date || '',
          birth_place: cand?.birth_place || '',
          citizenship: rec.citizenship || cand?.citizenship || 'РФ',
          phone: rec.phone || cand?.phone || '',
          email: rec.email || '',
          position: rec.position || cand?.position || '',
          skills: rec.skills || [],
          work_experience: rec.work_experience || '',
          salary_expectations: rec.salary_expectations || '',
          health_notes: rec.health_notes || '',
          city: rec.city || cand?.city || '',
          passport_series: rec.passport_series || '',
          passport_number: rec.passport_number || '',
          passport_issued_by: rec.passport_issued_by || '',
          passport_issued_date: rec.passport_issued_date || '',
          passport_dept_code: rec.passport_dept_code || '',
          registration_address: rec.registration_address || '',
          actual_address: rec.actual_address || '',
          education_level: rec.education_level || '',
          education_institution: rec.education_institution || '',
          education_specialty: rec.education_specialty || '',
          graduation_year: rec.graduation_year || '',
          additional_certs: rec.additional_certs || '',
          shift_experience: rec.shift_experience || '',
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
          motivation: rec.motivation || '',
          docs_ready: rec.docs_ready || [],
          ready_to_start_date: rec.ready_to_start_date || '',
          consent_given: rec.consent_given || false,
        }));
        if (editMode) {
          setIsEditing(true);
        } else {
          setSubmitted(true);
        }
      } else {
        // Pre-fill from candidate record only
        setForm(f => ({
          ...EMPTY_FORM,
          full_name: cand?.full_name || '',
          birth_date: cand?.birth_date || '',
          birth_place: cand?.birth_place || '',
          citizenship: cand?.citizenship || 'РФ',
          phone: cand?.phone || '',
          city: cand?.city || '',
          position: cand?.position || '',
        }));
        setIsEditing(true);
      }
      setLoading(false);
    };
    loadForm();
  }, [token, editMode]);

  const toggleArr = (key, val) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(s => s !== val) : [...f[key], val],
    }));
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.consent_given) { alert('Необходимо дать согласие на обработку персональных данных'); return; }
    if (!form.full_name || !form.birth_date || !form.phone) {
      alert('Пожалуйста, заполните обязательные поля: ФИО, дату рождения, телефон'); return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    const saveData = {
      ...form,
      consent_timestamp: now,
      submitted_at: now,
      status: 'completed',
    };
    await base44.entities.CandidateForm.update(formRecord.id, saveData);
    if (formRecord.candidate_id) {
      await base44.entities.Candidate.update(formRecord.candidate_id, {
        full_name: form.full_name,
        birth_date: form.birth_date,
        birth_place: form.birth_place || candidate?.birth_place,
        phone: form.phone,
        city: form.city || candidate?.city,
        citizenship: form.citizenship,
        position: form.position || candidate?.position,
        form_status: 'completed',
        form_submitted_at: now,
      });
    }
    setSubmitted(true);
    setIsEditing(false);
    setSubmitting(false);
  };

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7B3FBF] transition-all";
  const lbl = "block text-xs text-white/45 mb-1.5 font-medium";

  if (loading) return (
    <div className="min-h-screen bg-[#05070A] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#7B3FBF]" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-[#05070A] flex items-center justify-center px-4">
      <div className="text-center">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Анкета не найдена</h1>
        <p className="text-white/40 text-sm">Ссылка недействительна или устарела.</p>
      </div>
    </div>
  );

  if (submitted && !isEditing) return (
    <div className="min-h-screen bg-[#05070A] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">Анкета успешно отправлена</h1>
        <p className="text-white/50 text-sm leading-relaxed">
          Ваши данные получены и переданы кадровому агентству для обработки.<br />
          Согласие на обработку персональных данных подтверждено.
        </p>
        {formRecord?.submitted_at && (
          <p className="text-white/25 text-xs mt-4">
            Отправлено: {new Date(formRecord.submitted_at).toLocaleString('ru-RU')}
          </p>
        )}
        <button onClick={() => { setSubmitted(false); setIsEditing(true); }}
          className="mt-6 px-5 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white/80 hover:border-white/20 transition-all">
          Редактировать анкету
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05070A] text-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png"
            className="w-12 h-12 object-contain mx-auto mb-4" alt="logo" />
          <h1 className="text-2xl font-black mb-1">Анкета кандидата</h1>
          <p className="text-white/35 text-xs">ООО «Братоуверие-СНБ» · Программа восстановления ЛНР и ДНР</p>
          {candidate?.agency_name && (
            <p className="text-white/40 text-sm mt-1">Агентство: <span className="text-[#7B3FBF]">{candidate.agency_name}</span></p>
          )}
          {formRecord?.status === 'completed' && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400">
              <CheckCircle size={12} /> Анкета заполнена — редактирование
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* РАЗДЕЛ 1: Персональные данные */}
          <Section title="Раздел 1. Персональные данные">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={lbl}>ФИО <span className="text-red-400">*</span></label>
                <input className={inp} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Иванов Иван Иванович" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Дата рождения <span className="text-red-400">*</span></label>
                  <input className={inp} type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} required />
                </div>
                <div>
                  <label className={lbl}>Гражданство</label>
                  <input className={inp} value={form.citizenship} onChange={e => set('citizenship', e.target.value)} placeholder="РФ" />
                </div>
              </div>
              <div>
                <label className={lbl}>Место рождения</label>
                <input className={inp} value={form.birth_place} onChange={e => set('birth_place', e.target.value)} placeholder="г. Москва" />
              </div>
              <div>
                <label className={lbl}>Адрес регистрации</label>
                <input className={inp} value={form.registration_address} onChange={e => set('registration_address', e.target.value)} placeholder="г. Хабаровск, ул. Примерная, д. 1, кв. 1" />
              </div>
              <div>
                <label className={lbl}>Фактический адрес проживания</label>
                <input className={inp} value={form.actual_address} onChange={e => set('actual_address', e.target.value)} placeholder="Если отличается от регистрации" />
              </div>
            </div>

            <div className="mt-2 pt-4 border-t border-white/6">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Паспорт гражданина РФ</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Серия</label>
                  <input className={inp} value={form.passport_series} onChange={e => set('passport_series', e.target.value)} placeholder="1234" />
                </div>
                <div>
                  <label className={lbl}>Номер</label>
                  <input className={inp} value={form.passport_number} onChange={e => set('passport_number', e.target.value)} placeholder="567890" />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Кем выдан</label>
                  <input className={inp} value={form.passport_issued_by} onChange={e => set('passport_issued_by', e.target.value)} placeholder="МВД России по г. Москва" />
                </div>
                <div>
                  <label className={lbl}>Дата выдачи</label>
                  <input className={inp} type="date" value={form.passport_issued_date} onChange={e => set('passport_issued_date', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Код подразделения</label>
                  <input className={inp} value={form.passport_dept_code} onChange={e => set('passport_dept_code', e.target.value)} placeholder="770-001" />
                </div>
              </div>
            </div>

            <div className="mt-2 pt-4 border-t border-white/6">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Контактные данные</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className={lbl}>Телефон <span className="text-red-400">*</span></label>
                  <input className={inp} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 (___) ___-__-__" required />
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="example@mail.ru" />
                </div>
              </div>
            </div>
          </Section>

          {/* РАЗДЕЛ 2: Специализация */}
          <Section title="Раздел 2. Специализация и квалификация">
            <div>
              <label className={lbl}>Желаемая должность</label>
              <select className={inp} value={form.position} onChange={e => set('position', e.target.value)}>
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
              <textarea className={inp + ' resize-none'} rows={2} value={form.additional_certs} onChange={e => set('additional_certs', e.target.value)} placeholder="Удостоверение сварщика, водительские права категории C, допуск к работе на высоте..." />
            </div>
            <div>
              <label className={lbl}>Профессиональные навыки</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {SKILLS_LIST.map(skill => (
                  <button key={skill} type="button" onClick={() => toggleArr('skills', skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${form.skills.includes(skill) ? 'bg-[#7B3FBF]/30 border-[#7B3FBF]/60 text-[#C9A84C]' : 'bg-white/4 border-white/10 text-white/50 hover:border-white/25'}`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* РАЗДЕЛ 3: Опыт работы */}
          <Section title="Раздел 3. Опыт работы вахтовым методом">
            <div>
              <label className={lbl}>Общий опыт работы</label>
              <textarea className={inp + ' resize-none'} rows={4} value={form.work_experience} onChange={e => set('work_experience', e.target.value)} placeholder="Укажите последние места работы: организация, должность, период работы, причина увольнения..." />
            </div>
            <div>
              <label className={lbl}>Опыт работы вахтовым методом</label>
              <textarea className={inp + ' resize-none'} rows={2} value={form.shift_experience} onChange={e => set('shift_experience', e.target.value)} placeholder="Регион, объект, продолжительность вахты, работодатель..." />
            </div>
          </Section>

          {/* РАЗДЕЛ 4: Здоровье */}
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
              <label className={lbl}>Дополнительные сведения о состоянии здоровья</label>
              <textarea className={inp + ' resize-none'} rows={2} value={form.health_notes} onChange={e => set('health_notes', e.target.value)} placeholder="Аллергии, особые требования к условиям труда..." />
            </div>
          </Section>

          {/* РАЗДЕЛ 5: Семья */}
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
            <div className="pt-2 border-t border-white/6">
              <p className="text-xs text-white/40 mb-3">Контактное лицо на случай экстренной связи</p>
              <div className="grid grid-cols-1 gap-3">
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

          {/* РАЗДЕЛ 6: Воинский учёт */}
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

          {/* РАЗДЕЛ 7: Судимость */}
          <Section title="Раздел 7. Судимость" defaultOpen={false}>
            <div>
              <label className={lbl}>Наличие судимостей</label>
              <div className="flex gap-3 mt-1">
                {['Нет','Да, погашена','Да, действующая'].map(opt => (
                  <button key={opt} type="button" onClick={() => set('has_criminal_record', opt)}
                    className={`flex-1 py-2.5 rounded-xl text-sm border transition-all ${form.has_criminal_record === opt ? 'bg-[#7B3FBF]/25 border-[#7B3FBF]/50 text-white' : 'bg-white/3 border-white/8 text-white/40 hover:border-white/20'}`}>
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

          {/* РАЗДЕЛ 8: Мотивация */}
          <Section title="Раздел 8. Мотивация и ожидания" defaultOpen={false}>
            <div>
              <label className={lbl}>Ожидаемая заработная плата</label>
              <input className={inp} value={form.salary_expectations} onChange={e => set('salary_expectations', e.target.value)} placeholder="от 100 000 ₽ / мес." />
            </div>
            <div>
              <label className={lbl}>Мотивация / почему хотите участвовать в программе</label>
              <textarea className={inp + ' resize-none'} rows={3} value={form.motivation} onChange={e => set('motivation', e.target.value)} placeholder="Опишите вашу мотивацию..." />
            </div>
          </Section>

          {/* РАЗДЕЛ 9: Готовность документов */}
          <Section title="Раздел 9. Готовность документов" defaultOpen={false}>
            <div>
              <label className={lbl}>Имеющиеся документы (отметьте)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DOCS_READY.map(doc => (
                  <button key={doc} type="button" onClick={() => toggleArr('docs_ready', doc)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${form.docs_ready.includes(doc) ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-white/4 border-white/10 text-white/50 hover:border-white/25'}`}>
                    {doc}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={lbl}>Готов приступить к работе с</label>
              <input className={inp} type="date" value={form.ready_to_start_date} onChange={e => set('ready_to_start_date', e.target.value)} />
            </div>
          </Section>

          {/* РАЗДЕЛ 10: Согласие */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-[#7B3FBF] uppercase tracking-widest mb-4">Раздел 10. Подпись и согласие</h2>
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              Подтверждаю, что все данные, указанные в анкете, являются достоверными. Даю согласие на
              обработку моих персональных данных в соответствии с Федеральным законом №152-ФЗ «О персональных данных».
            </p>
            <a href="/consent" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#7B3FBF] hover:underline mb-4">
              <ExternalLink size={12} /> Ознакомиться с полным текстом согласия на обработку ПДн
            </a>
            <label className="flex items-start gap-3 cursor-pointer group mt-3">
              <div
                onClick={() => set('consent_given', !form.consent_given)}
                className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${form.consent_given ? 'bg-[#7B3FBF] border-[#7B3FBF]' : 'border-white/25 group-hover:border-[#7B3FBF]/60'}`}>
                {form.consent_given && <CheckCircle size={12} className="text-white" />}
              </div>
              <span className="text-sm text-white/70 leading-relaxed">
                <strong className="text-white">Согласен(а)</strong> на обработку персональных данных.
                Подтверждаю достоверность указанных сведений.
              </span>
            </label>
          </div>

          <button type="submit" disabled={submitting || !form.consent_given}
            className="w-full py-4 rounded-xl bg-[#7B3FBF] text-white font-black text-base hover:bg-[#8B4FCF] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {submitting
              ? <><Loader2 size={18} className="animate-spin" /> Сохранение...</>
              : formRecord?.status === 'completed' ? 'Сохранить изменения' : 'Подписать и отправить анкету'}
          </button>
          <p className="text-center text-xs text-white/20 pb-4">
            * — обязательные для заполнения поля
          </p>
        </form>
      </div>
    </div>
  );
}
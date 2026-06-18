import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const POSITIONS = ['Разнорабочий','Строитель','Водитель B','Водитель C','Водитель CE','Водитель D','Автослесарь','Инженер связи','Оператор БПЛА','Взрывотехник','Медицинский работник','Охранник'];
const SKILLS_LIST = ['Работа с инструментом','Сварочные работы','Вождение грузовых авто','Электромонтаж','Погрузо-разгрузочные работы','Работа на высоте','Знание ПК','Работа с документами','Охрана порядка','Медицинская помощь','Управление БПЛА','Взрывные работы'];

export default function CandidateOnboarding() {
  const { token } = useParams();
  const [formRecord, setFormRecord] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    birth_date: '',
    passport_number: '',
    email: '',
    phone: '',
    city: '',
    citizenship: 'РФ',
    position: '',
    work_experience: '',
    skills: [],
    salary_expectations: '',
    health_notes: '',
    consent_given: false,
  });

  useEffect(() => {
    const loadForm = async () => {
      const records = await base44.entities.CandidateForm.filter({ form_token: token });
      if (!records.length) { setNotFound(true); setLoading(false); return; }
      const rec = records[0];
      if (rec.status === 'completed') { setSubmitted(true); setFormRecord(rec); setLoading(false); return; }
      setFormRecord(rec);
      // Pre-fill from candidate
      const cands = await base44.entities.Candidate.filter({ id: rec.candidate_id });
      const cand = cands[0] || null;
      setCandidate(cand);
      if (cand) {
        setForm(f => ({
          ...f,
          full_name: cand.full_name || '',
          birth_date: cand.birth_date || '',
          phone: cand.phone || '',
          city: cand.city || '',
          citizenship: cand.citizenship || 'РФ',
          position: cand.position || '',
        }));
      }
      setLoading(false);
    };
    loadForm();
  }, [token]);

  const toggleSkill = (skill) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.consent_given) { alert('Необходимо дать согласие на обработку персональных данных'); return; }
    if (!form.full_name || !form.birth_date || !form.passport_number || !form.phone) {
      alert('Пожалуйста, заполните все обязательные поля'); return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    await base44.entities.CandidateForm.update(formRecord.id, {
      ...form,
      consent_timestamp: now,
      submitted_at: now,
      status: 'completed',
    });
    // Update the Candidate record
    if (formRecord.candidate_id) {
      await base44.entities.Candidate.update(formRecord.candidate_id, {
        full_name: form.full_name,
        birth_date: form.birth_date,
        phone: form.phone,
        city: form.city,
        citizenship: form.citizenship,
        position: form.position || candidate?.position,
        form_status: 'completed',
        form_submitted_at: now,
      });
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7B3FBF] transition-all";
  const label = "block text-xs text-white/50 mb-1.5 font-medium";

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

  if (submitted) return (
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
          <h1 className="text-2xl font-black mb-2">Анкета кандидата</h1>
          {candidate?.agency_name && (
            <p className="text-white/40 text-sm">Агентство: <span className="text-[#7B3FBF]">{candidate.agency_name}</span></p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal info */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#7B3FBF] uppercase tracking-widest mb-4">Личные данные</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={label}>ФИО <span className="text-red-400">*</span></label>
                <input className={inp} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Иванов Иван Иванович" required />
              </div>
              <div>
                <label className={label}>Дата рождения <span className="text-red-400">*</span></label>
                <input className={inp} type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} required />
              </div>
              <div>
                <label className={label}>Серия и номер паспорта <span className="text-red-400">*</span></label>
                <input className={inp} value={form.passport_number} onChange={e => set('passport_number', e.target.value)} placeholder="1234 567890" required />
              </div>
              <div>
                <label className={label}>Телефон <span className="text-red-400">*</span></label>
                <input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 (___) ___-__-__" required />
              </div>
              <div>
                <label className={label}>Email</label>
                <input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="example@mail.ru" />
              </div>
              <div>
                <label className={label}>Гражданство</label>
                <input className={inp} value={form.citizenship} onChange={e => set('citizenship', e.target.value)} placeholder="РФ" />
              </div>
              <div>
                <label className={label}>Город проживания</label>
                <input className={inp} value={form.city} onChange={e => set('city', e.target.value)} placeholder="г. Хабаровск" />
              </div>
            </div>
          </div>

          {/* Professional info */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#7B3FBF] uppercase tracking-widest mb-4">Профессиональная информация</h2>
            <div>
              <label className={label}>Желаемая должность</label>
              <select className={inp} value={form.position} onChange={e => set('position', e.target.value)}>
                <option value="">Выберите должность...</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Опыт работы</label>
              <textarea className={inp + ' resize-none'} rows={4} value={form.work_experience} onChange={e => set('work_experience', e.target.value)} placeholder="Опишите ваш опыт работы, предыдущие места работы и занимаемые должности..." />
            </div>
            <div>
              <label className={label}>Профессиональные навыки</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SKILLS_LIST.map(skill => (
                  <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${form.skills.includes(skill) ? 'bg-[#7B3FBF]/30 border-[#7B3FBF]/60 text-[#C9A84C]' : 'bg-white/4 border-white/10 text-white/50 hover:border-white/25'}`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={label}>Ожидания по зарплате</label>
              <input className={inp} value={form.salary_expectations} onChange={e => set('salary_expectations', e.target.value)} placeholder="от 80 000 ₽" />
            </div>
            <div>
              <label className={label}>Состояние здоровья / ограничения</label>
              <textarea className={inp + ' resize-none'} rows={2} value={form.health_notes} onChange={e => set('health_notes', e.target.value)} placeholder="Укажите при наличии ограничений по здоровью..." />
            </div>
          </div>

          {/* Consent */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-[#7B3FBF] uppercase tracking-widest mb-4">Согласие на обработку персональных данных</h2>
            <p className="text-xs text-white/40 leading-relaxed mb-5">
              В соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных», я даю своё согласие
              ООО «Братоуверие-СНБ» на обработку моих персональных данных, включая сбор, систематизацию, накопление,
              хранение, уточнение, использование, распространение, обезличивание, блокирование и уничтожение, в целях
              рассмотрения моей кандидатуры на трудоустройство. Согласие действует до его отзыва в письменном виде.
            </p>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${form.consent_given ? 'bg-[#7B3FBF] border-[#7B3FBF]' : 'border-white/25 group-hover:border-[#7B3FBF]/60'}`}
                onClick={() => set('consent_given', !form.consent_given)}>
                {form.consent_given && <CheckCircle size={12} className="text-white" />}
              </div>
              <span className="text-sm text-white/70 leading-relaxed">
                <strong className="text-white">Я согласен(а)</strong> на обработку моих персональных данных в соответствии
                с изложенными условиями. Подтверждаю, что указанные сведения достоверны.
              </span>
            </label>
          </div>

          <button type="submit" disabled={submitting || !form.consent_given}
            className="w-full py-4 rounded-xl bg-[#7B3FBF] text-white font-black text-base hover:bg-[#8B4FCF] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={18} className="animate-spin" /> Отправка...</> : 'Подписать и отправить анкету'}
          </button>
          <p className="text-center text-xs text-white/20">
            Отправляя анкету, вы подтверждаете достоверность указанных сведений
          </p>
        </form>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { BookOpen, Target, Zap, MessageSquare, Shield, ClipboardList, Send, Phone, Star, HelpCircle, CheckSquare, Check, ArrowRight, Clock, Banknote, Mail, Users, TrendingUp, Award, Home, Heart, AlertTriangle, ChevronUp } from 'lucide-react';
import CopyBlock from '@/components/handbook/CopyBlock';
import { CALL_SCRIPT_BLOCKS } from '@/lib/callScripts';

/**
 * ВАЖНО: Скрипты звонка вынесены в src/lib/callScripts.js (CALL_SCRIPT_BLOCKS).
 * Этот файл — единый источник истины для блоков скрипта.
 * Блоки используются в двух местах:
 * 1. Здесь (руководство) — для отображения
 * 2. CallDrawer.jsx — для выбора блока при звонке кандидату
 * При внесении правок в скрипты изменяйте их в callScripts.js, а не здесь.
 */

const SECTIONS = [
  { id: 'intro', icon: BookOpen, title: 'Введение' },
  { id: 'deal', icon: Target, title: 'Анатомия сделки' },
  { id: 'process', icon: Zap, title: 'Процесс' },
  { id: 'script', icon: MessageSquare, title: 'Скрипт' },
  { id: 'objections', icon: Shield, title: 'Антивозражения' },
  { id: 'crm', icon: ClipboardList, title: 'CRM' },
  { id: 'followup', icon: Send, title: 'Follow-up' },
  { id: 'contacts', icon: Phone, title: 'Контакты' },
  { id: 'reviews', icon: Star, title: 'Отзывы' },
  { id: 'faq', icon: HelpCircle, title: 'FAQ' },
  { id: 'checklist', icon: CheckSquare, title: 'Чеклист' },
];

const POSITIONS = [
  { icon: '👷', title: 'Разнорабочий', salary: '300–340K ₽/мес', note: 'Подходит всем. Опыт на стройке 3–6 мес.' },
  { icon: '🧱', title: 'Строитель', salary: '330–390K ₽/мес', note: 'Каменщик, отделочник, плотник, электромонтёр' },
  { icon: '🚗', title: 'Водитель', salary: '300–380K ₽/мес', note: 'Автобус, грузовик, спецтехника. Кат. B/C/CE/D' },
  { icon: '🔧', title: 'Автослесарь', salary: '320–360K ₽/мес', note: 'Техобслуживание и ремонт. Свои инструменты — плюс' },
  { icon: '🩺', title: 'Медработник', salary: '340–380K ₽/мес', note: 'Фельдшер, медсестра, врач. Действующий сертификат' },
  { icon: '🛡️', title: 'Охранник', salary: '310–350K ₽/мес', note: 'Охрана объектов. Удостоверение ЧОП' },
  { icon: '🚜', title: 'Оператор спецтехники', salary: '300–380K ₽/мес', note: 'Бульдозер, экскаватор, погрузчик' },
];

const OBJECTIONS = [
  { says: '«Это же военный контракт, я не боец?»', answer: 'Нет. Это трудовой договор по ТК РФ с компанией «БРО-СНБ». Вы не военный, не носите оружие, не воюете. Это гражданская работа — восстановление домов, дорог, школ. ТК РФ защищает вас полностью.' },
  { says: '«А если там обстрелы? Я погибну?»', answer: 'Базы расположены в 70–100 км от боевых действий. За 2 года среди 1197 участников — 0 смертей, 99% вернулись здоровыми. Страховка 1.5–14.7 млн ₽ вас полностью защищает.' },
  { says: '«Как я получу деньги? Не обманут?»', answer: 'Всё переводится на вашу карту 2 раза в месяц. Подъёмные 625 000 ₽ — в течение 5 дней после подписания. Компания зарегистрирована в ФНС (ОГРН 1262500006966), имеет благодарности от Правительства РФ.' },
  { says: '«Я слышал, там держат против воли?»', answer: 'Это не так. Вы можете уйти в любой момент по ТК РФ — заявление за 2 недели. Все деньги выплачиваются полностью. На объектах есть инспектор труда и профсоюз.' },
  { says: '«Могу вернуться домой на выходной?»', answer: 'Да! Выходные — в городах (Макеевка, Луганск). Интернет на базе, звоните семье каждый день. Раз в месяц — 2–3 дня отпуска домой.' },
  { says: '«А если заболею? Оплатят?»', answer: 'Больничный 60–80% от оклада по ТК РФ. На базе — медпункт и врач, осмотр и лечение бесплатно. Серьёзное — отправим в больницу в городе.' },
  { says: '«Какие документы? Можно подделать?»', answer: 'Нужны: паспорт, СНИЛС, ИНН, справка о несудимости, резюме. Ничего подделывать нельзя — всё проверяет СБ. Если документ неполный — просто переснимаете.' },
  { says: '«Жильё нормальное? Не казарма?»', answer: 'Комната на 2–3 человека. Интернет, ТВ, кровати, шкафы. Не 5-звёздочный отель, но комфортно. Столовая рядом, спортзал, психолог.' },
  { says: '«Оборудование своё или выдают?»', answer: 'Всё предоставляется: спецодежда, инструменты, защита, техника. Приходите с паспортом и чемоданом — остальное выдадут.' },
  { says: '«Сколько часов работаю? Выходные?»', answer: '8–12 часов, 5–6 дней в неделю. Ритм: подъём 06:30, на объекте 08:00, возврат 17:00–17:30, вечер свободный. Выходные — в городе.' },
  { says: '«Я не гражданин РФ. Можно?»', answer: 'Граждане СНГ рассматриваются индивидуально. Нужно согласование с СБ. Гарантий нет, но попытаться стоит — оставьте заявку.' },
  { says: '«Я в запасе. Могут забрать в армию?»', answer: 'Нет. Участники программы имеют иммунитет от мобилизации — прописано в договоре. Защита на время контракта и 3 месяца после.' },
  { says: '«Сколько получу на руки конкретно?»', answer: 'Разнорабочий — 261K на руки (после 13% НДФЛ). Строитель — до 340K. Плюс 625K подъёмных без налога. За 3 месяца — от 1.4 млн ₽.' },
  { says: '«Можно с другом/напарником?»', answer: 'Да! Приводите — будете вместе на объекте. Иван и Пётр приехали вдвоём и заработали 2.9 млн ₽. Создам карточки на обоих прямо сейчас.' },
  { says: '«Давайте я позвоню завтра?»', answer: 'Понимаю, но сегодня есть свободное место, а завтра может быть занято. Мест 200, осталось 47. Внесу в систему за 5 минут — если что, откажетесь. Давайте зафиксируем сегодня?' },
];

const PROCESS = [
  { day: 'День 1', title: 'Первый звонок', desc: 'Менеджер звонит → берёт ФИО, номер, город, должность. 5 минут.', color: 'purple' },
  { day: 'День 2–3', title: 'Телефонное интервью', desc: '10–15 минут по скрипту: опыт, мотивация, условия, семья, здоровье. Завершение: «Внесу в систему, получите ссылку на анкету».', color: 'purple' },
  { day: 'День 4', title: 'Карточка в CRM', desc: 'Менеджер создаёт карточку: ФИО + дата рождения + телефон + должность + город. СТОП-ЛИСТ проверяет дубли. Генерируется ссылка на анкету.', color: 'gold' },
  { day: 'День 5–6', title: 'Кандидат заполняет анкету', desc: 'Менеджер отправляет ссылку в WhatsApp/Telegram. Follow-up: «Заполнили? Если вопросы — помогу». Статус: «Ожидает» → «Заполнена».', color: 'gold' },
  { day: 'День 7', title: 'Передача на СБ', desc: 'Менеджер пишет координатору: «[Агентство] — Заявка — [ФИ] — [категория] — [кол-во]».', color: 'gold' },
  { day: 'День 8–10', title: 'Проверка СБ', desc: '2–3 рабочих дня. Проверка судимости, воинского учёта. Координатор обновляет статус в CRM. Кандидату: «Проверка пройдена, выезжаешь в точку сбора».', color: 'gold' },
  { day: 'День 11–12', title: 'Прибытие в точку сбора', desc: 'Тамбов, Воронеж, Ростов и т.д. Жильё бесплатное (общежитие). Кандидат пишет координатору адрес.', color: 'green' },
  { day: 'День 13–14', title: 'Медкомиссия', desc: 'ВТ–ПТ, 08:00–16:00. 2–3 часа: кровь, рентген, ЭКГ, осмотры, психолог. Результаты за 3–5 дней. Не отбраковка, а документирование.', color: 'green' },
  { day: 'День 15', title: 'Подписание договора', desc: 'ТК РФ, 2 экземпляра. Кандидат видит: зарплату, подъёмные, гарантии, страховку.', color: 'green' },
  { day: 'День 16', title: 'Выплата подъёмных', desc: '625 000 ₽ на карту, без налога, в течение 5 дней.', color: 'green' },
  { day: 'День 17–18', title: 'Отправка в Ростов-на-Дону', desc: 'Самолёт или поезд за счёт программы. Билеты сохранить — компенсация на объекте.', color: 'green' },
  { day: 'День 19–21', title: 'Приезд в Макеевку', desc: 'Инструктажи, выдача спецодежды, получение пропуска. Распределение на объекты.', color: 'green' },
  { day: 'День 22', title: 'Первый день работы', desc: 'Зарплата начислится в конце месяца.', color: 'green' },
];

const REVIEWS = [
  { name: 'Максим О.', role: 'Фельдшер', earned: '1.4 млн ₽', story: 'Заработал 1.4 млн за 3 месяца. Купил машину, вернулся во второй раз. Говорит — лучшее решение, которое он принял.' },
  { name: 'Игорь Л.', role: 'Машинист бульдозера', earned: '1.5 млн ₽', story: 'Купил квартиру за счёт этих денег. Третий контракт готовит. «Дома таких денег не заработать».' },
  { name: 'Павел Г.', role: 'Автослесарь', earned: '1.45 млн ₽', story: 'Купил однушку. Постоянная вахта — второй контракт уже подписан.' },
  { name: 'Иван и Пётр', role: 'Рабочие', earned: '2.9 млн ₽ вдвоём', story: 'Приехали вместе, заработали 2.9 млн. Сейчас готовят документы на второй контракт.' },
];

const FAQ = [
  { q: 'Это легально?', a: 'Да. Постановление Правительства РФ. Официальное трудоустройство по ТК РФ. ОГРН 1262500006966.' },
  { q: 'Когда придут подъёмные?', a: '625 000 ₽ в течение 5 дней после подписания договора. На карту, без налога.' },
  { q: 'Нас не мобилизуют?', a: 'Участники программы имеют иммунитет от мобилизации. Прописано в договоре. Защита на время контракта + 3 месяца после.' },
  { q: 'Можно с семьёй?', a: 'Нет. Комната на 2–3 человека. Это вахта, не ПМЖ. Но выходные в городе, интернет для звонков семье — каждый день.' },
  { q: 'Какой график?', a: '8–12 часов, 5–6 дней в неделю. Подъём 06:30, объект 08:00, возврат 17:00–17:30. Вечер свободный.' },
  { q: 'Сколько человек в комнате?', a: '2–3. Интернет, ТВ, кровати, шкафы. Столовая, спортзал, психолог — всё рядом.' },
  { q: 'Компенсация проезда?', a: '100%. Билеты сохранить, компенсация при трудоустройстве на объекте.' },
  { q: 'Какая страховка?', a: '1.5–14.7 млн ₽, включена в условия. Полная защита.' },
  { q: 'Что с больничным?', a: '60–80% от оклада по ТК РФ. На базе — медпункт и врач, лечение бесплатно.' },
  { q: 'Какие документы нужны?', a: 'Паспорт, СНИЛС, ИНН, справка о несудимости, резюме. Ничего подделывать нельзя — всё проверяет СБ.' },
];

const CONTACTS = [
  { icon: '👨‍💼', title: 'Координатор', phone: '+7 (4212) 51-59-30 доб. 702', email: 'partner@bratouverie-snb.ru', hours: 'Пн–Чт 09:00–18:00, Пт до 17:00', desc: 'Согласование кандидатов, распределение на объекты' },
  { icon: '🧠', title: 'Психолог', phone: '+7 (4212) 51-59-30 доб. 704', hours: '24/7', desc: 'Тоска по дому, страх, стресс, семейные проблемы' },
  { icon: '⚖️', title: 'Юрист', phone: '+7 (4212) 51-59-30 доб. 704', hours: 'На базе 24/7', desc: 'Защита прав, консультация, помощь при конфликте. Бесплатно' },
  { icon: '🔔', title: 'Горячая линия', phone: '8-800-222-84-63', hours: '24/7', desc: 'Проблемы, жалобы, неотложные ситуации' },
];

const FOLLOWUPS = [
  { title: 'Сразу после создания карточки', text: `Здравствуйте, [ФИО]!\n\nВот ваша личная анкета для участия в программе восстановления ДНР/ЛНР:\n[ссылка]\n\nЗаполнение займёт около 15 минут. Если возникнут вопросы — пишите, я помогу.` },
  { title: 'Через 2 дня (если не заполнил)', text: `[ФИО], добрый день!\n\nПроверил — анкета пока не заполнена. Не забудьте, пожалуйста, заполнить сегодня-завтра.\n\nЕсли что-то непонятно — звоните, подскажу. Это займёт всего 15 минут.` },
  { title: 'Проверка СБ пройдена', text: `[ФИО], отличные новости!\n\nПроверка безопасности пройдена ✓\nТеперь нужно приехать в точку сбора ([город]) на медкомиссию.\n\nКогда сможете приехать?` },
  { title: 'Напоминание о медкомиссии', text: `[ФИО], напоминаю — завтра медкомиссия.\n\nВозьмите: паспорт, СНИЛС, справку о несудимости.\nПриехать к 08:00 по адресу: [адрес]\n\nОбследование займёт 2–3 часа.` },
  { title: 'После оформления', text: `[ФИО], поздравляю!\n\nДоговор подписан, подъёмные 625 000 ₽ поступят на карту в течение 5 дней.\n\nОтправка — [дата]. Билеты сохранить для компенсации.\n\nЕсли есть вопросы — я на связи!` },
];

export default function ManagerHandbook() {
  const [activeSection, setActiveSection] = useState('intro');
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTop(window.scrollY > 600);
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom >= 140) {
            setActiveSection(s.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const colorMap = {
    purple: 'border-[rgba(123,63,191,0.4)] bg-[rgba(123,63,191,0.15)] text-[#7B3FBF]',
    gold: 'border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.15)] text-[#C9A84C]',
    green: 'border-green-500/40 bg-green-500/15 text-green-400',
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F8FAFC]">
      {/* Header */}
      <div className="border-b border-[rgba(123,63,191,0.15)] bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png" className="w-7 h-7 object-contain flex-shrink-0" alt="logo" />
            <span className="text-[rgba(123,63,191,0.4)] hidden sm:inline">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen size={14} className="text-[#7B3FBF] flex-shrink-0" />
              <span className="text-sm font-bold text-[#F8FAFC] truncate">Руководство менеджера</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/25 whitespace-nowrap">v2.0</span>
          </div>
          <a href="/agency/workspace" className="text-xs text-[#F8FAFC]/40 hover:text-[#7B3FBF] transition-colors whitespace-nowrap flex-shrink-0">← В CRM</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex gap-8">
        {/* Sidebar nav */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-24 space-y-0.5">
            {SECTIONS.map((s, i) => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${activeSection === s.id ? 'bg-[rgba(123,63,191,0.15)] text-[#7B3FBF] font-bold' : 'text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70 hover:bg-white/5'}`}>
                <span className="text-[10px] font-mono opacity-50">{i + 1}</span>
                <s.icon size={13} className="flex-shrink-0" />
                <span>{s.title}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-12">

          {/* Hero */}
          <div className="glass-card-gold rounded-2xl px-6 py-6">
            <h1 className="text-2xl font-black text-[#F8FAFC] mb-1">Полное руководство менеджера</h1>
            <p className="text-sm text-[#F8FAFC]/55">Программа восстановления ДНР/ЛНР · ООО «БРО-СНБ-СНБ»</p>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Зарплата', value: '300–390K ₽/мес' },
                { label: 'Подъёмные', value: '625 000 ₽' },
                { label: 'За 3 месяца', value: '~1.6 млн ₽' },
                { label: 'Вахта', value: '3 месяца' },
              ].map(s => (
                <div key={s.label} className="bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)] rounded-lg px-3 py-2.5">
                  <div className="text-xs text-[#F8FAFC]/35 mb-0.5">{s.label}</div>
                  <div className="text-sm font-black text-[#C9A84C]">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 1: Введение */}
          <section id="intro" className="scroll-mt-24">
            <SectionHeader num="1" icon={BookOpen} title="Введение для менеджера" accent="purple" />
            <div className="space-y-4 mt-4">
              <p className="text-sm text-[#F8FAFC]/75 leading-relaxed">
                Вы — менеджер кадрового агентства, партнёр программы восстановления ДНР и ЛНР. Ваша задача — находить кандидатов,
                убеждать их и проводить через процесс отбора до отправки на объект. <strong className="text-[#F8FAFC]">Это не продажи — это помощь людям изменить жизнь.</strong>
              </p>
              <p className="text-sm text-[#F8FAFC]/75 leading-relaxed">
                За 2 года программы: <strong className="text-green-400">1197 участников</strong>, <strong className="text-green-400">0 летальных исходов</strong>,
                <strong className="text-green-400"> 99% вернулись здоровыми</strong>, <strong className="text-[#C9A84C]">88% продлили контракт</strong>.
                Эти цифры — ваше главное оружие. Используйте их.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <StatCard icon={Users} value="1197" label="участников за 2 года" color="purple" />
                <StatCard icon={Heart} value="99%" label="вернулись здоровыми" color="green" />
                <StatCard icon={TrendingUp} value="88%" label="продлили контракт" color="gold" />
              </div>
              <div className="bg-red-500/8 border border-red-500/25 rounded-lg px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-300/80">
                    <strong>ВАЖНО:</strong> Вы не обещаете того, чего нет в программе. Вы говорите только цифры и факты из этого руководства.
                    Любые «договорённости на месте» — обман. Всё, что кандидат получит, прописано в трудовом договоре по ТК РФ.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Анатомия сделки */}
          <section id="deal" className="scroll-mt-24">
            <SectionHeader num="2" icon={Target} title="Анатомия сделки — что вы предлагаете" accent="gold" />
            <div className="space-y-4 mt-4">
              <p className="text-sm text-[#F8FAFC]/75 leading-relaxed">
                Кандидату вы предлагаете: <strong className="text-[#F8FAFC]">гражданскую работу</strong> по ТК РФ на стройках и объектах
                восстановления ДНР/ЛНР. Вахта 3 месяца. Объекты: Мариуполь, Макеевка, Луганск, Алчевск.
              </p>

              {/* Financials */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Banknote size={15} className="text-[#C9A84C]" />
                    <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-widest">Финансы</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-[#F8FAFC]/50">Зарплата</span><span className="text-[#C9A84C] font-bold">300–390K ₽/мес</span></div>
                    <div className="flex justify-between"><span className="text-[#F8FAFC]/50">На руки (после 13% НДФЛ)</span><span className="text-[#F8FAFC]">261–340K ₽</span></div>
                    <div className="flex justify-between"><span className="text-[#F8FAFC]/50">Подъёмные (без налога)</span><span className="text-green-400 font-bold">625 000 ₽</span></div>
                    <div className="flex justify-between"><span className="text-[#F8FAFC]/50">Итого за 3 месяца</span><span className="text-[#C9A84C] font-black text-sm">~1 646 875 ₽</span></div>
                    <div className="flex justify-between"><span className="text-[#F8FAFC]/50">Больничный</span><span className="text-[#F8FAFC]">60–80% по ТК РФ</span></div>
                    <div className="flex justify-between"><span className="text-[#F8FAFC]/50">Выплаты</span><span className="text-[#F8FAFC]">2 раза в месяц на карту</span></div>
                  </div>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Home size={15} className="text-[#7B3FBF]" />
                    <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-widest">Включено</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#F8FAFC]/65">
                    {['Жильё: комната на 2–3 чел.', 'Питание: 3-разовое', 'Проезд: 100% компенсация', 'Интернет: Wi-Fi на базе', 'Страховка: 1.5–14.7 млн ₽', 'Спецодежда и инструменты', 'Спортзал: 24/7', 'Психолог: 24/7'].map(item => (
                      <div key={item} className="flex items-start gap-2"><Check size={12} className="text-green-400 flex-shrink-0 mt-0.5" /><span>{item}</span></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Positions */}
              <div className="grid sm:grid-cols-2 gap-2">
                {POSITIONS.map(p => (
                  <div key={p.title} className="flex items-center gap-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(123,63,191,0.15)] rounded-lg p-3">
                    <span className="text-xl flex-shrink-0">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#F8FAFC] text-sm">{p.title}</div>
                      <div className="text-xs text-[#F8FAFC]/45">{p.note}</div>
                    </div>
                    <div className="text-xs font-bold text-[#C9A84C] whitespace-nowrap flex-shrink-0">{p.salary}</div>
                  </div>
                ))}
              </div>

              <div className="bg-red-500/8 border border-red-500/25 rounded-lg px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-300/80">
                    <strong>НЕ предлагайте:</strong> операторов БПЛА, взрывотехников, инженеров-связистов, воинские должности.
                    Этих вакансий в программе нет. Только гражданские специальности из списка выше.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Процесс */}
          <section id="process" className="scroll-mt-24">
            <SectionHeader num="3" icon={Zap} title="8-этапный процесс — от звонка до работы" accent="gold" />
            <div className="mt-4 space-y-3">
              <div className="bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.2)] rounded-lg px-4 py-2.5 text-xs text-[#C9A84C]/80 flex items-center gap-2">
                <Clock size={13} /> От заявки до первой зарплаты — ~30–45 дней. Узкие места: проверка СБ и медкомиссия.
              </div>
              {PROCESS.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-black ${colorMap[step.color]}`}>
                      {i + 1}
                    </div>
                    {i < PROCESS.length - 1 && <div className="w-px flex-1 bg-[rgba(123,63,191,0.15)] mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-[#F8FAFC] text-sm">{step.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${colorMap[step.color]}`}>{step.day}</span>
                    </div>
                    <p className="text-xs text-[#F8FAFC]/60 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Скрипт */}
          <section id="script" className="scroll-mt-24">
            <SectionHeader num="4" icon={MessageSquare} title="Скрипт телефонного интервью" accent="purple" />
            <p className="text-xs text-[#F8FAFC]/45 mt-2 mb-4">Готов к копированию. Адаптируйте под кандидата, но структуру сохраняйте.</p>
            <div className="space-y-4">
              {CALL_SCRIPT_BLOCKS.map((block, i) => (
                <ScriptPart key={i} label={block.label} text={block.text} />
              ))}
            </div>
          </section>

          {/* Section 5: Антивозражения */}
          <section id="objections" className="scroll-mt-24">
            <SectionHeader num="5" icon={Shield} title="Антивозражения — готовые ответы" accent="gold" />
            <p className="text-xs text-[#F8FAFC]/45 mt-2 mb-4">Кандидат говорит слева → вы отвечаете справа. Выучите эти ответы.</p>
            <div className="space-y-3">
              {OBJECTIONS.map((obj, i) => (
                <div key={i} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(123,63,191,0.15)] rounded-xl overflow-hidden">
                  <div className="bg-red-500/8 border-b border-red-500/15 px-4 py-2.5 flex items-start gap-2">
                    <span className="text-xs font-mono text-red-400/60 flex-shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm text-red-300/90 font-medium">{obj.says}</span>
                  </div>
                  <div className="px-4 py-3 flex items-start gap-2">
                    <ArrowRight size={14} className="text-[#7B3FBF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#F8FAFC]/75 leading-relaxed">{obj.answer}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 6: CRM */}
          <section id="crm" className="scroll-mt-24">
            <SectionHeader num="6" icon={ClipboardList} title="CRM и карточка кандидата" accent="purple" />
            <div className="space-y-4 mt-4">
              <div className="bg-[rgba(123,63,191,0.1)] border border-[rgba(123,63,191,0.25)] rounded-lg px-4 py-3 text-xs space-y-1">
                <div className="font-bold text-[#7B3FBF] mb-2">Доступ к CRM</div>
                <div>🔗 <a href="https://bratouverie-snb.base44.app/agency-login" className="text-[#7B3FBF] underline">bratouverie-snb.base44.app/agency-login</a></div>
                <div>📧 <a href="mailto:partner@bratouverie-snb.ru" className="text-[#C9A84C]">partner@bratouverie-snb.ru</a></div>
                <div>📞 +7 (4212) 51-59-30 доб. 702</div>
              </div>

              <Step num="1" title="Нажмите «Добавить кандидата»">
                Кнопка в правом верхнем углу рабочей области агентства.
              </Step>
              <Step num="2" title="Заполните минимальные данные">
                <div className="space-y-1 mt-1">
                  <div>• <strong className="text-[#F8FAFC]">ФИО полностью</strong> (как в паспорте)</div>
                  <div>• <strong className="text-[#C9A84C]">Дата рождения</strong> — критична для стоп-листа</div>
                  <div>• Телефон</div>
                  <div>• Должность / специализация</div>
                  <div>• Город проживания</div>
                </div>
              </Step>
              <Step num="3" title="Стоп-лист проверяет дубли">
                CRM автоматически ищет совпадения по ФИО + дата рождения. Если кандидат уже есть от другого агентства — сохранение блокируется.
              </Step>
              <Step num="4" title="Скопируйте ссылку на анкету">
                В строке кандидата найдите колонку «Анкета» → нажмите иконку 📋. Ссылка скопируется в буфер. Отправьте кандидату в WhatsApp/Telegram.
              </Step>
              <Step num="5" title="Контролируйте статус">
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20">Ожидает</span>
                  <span className="text-xs">— ссылка отправлена, анкета не заполнена</span>
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/25">✓ Заполнена</span>
                  <span className="text-xs">— данные получены, передавайте на СБ</span>
                </div>
              </Step>
              <Step num="6" title="Передайте на СБ">
                Когда анкета заполнена — данные автоматически обновляются в карточке. Напишите координатору: <br />
                <span className="bg-[#0D1B3E] rounded px-2 py-1 text-xs text-[#F8FAFC]/70 italic inline-block mt-1">[Агентство] — Заявка — [ФИО] — [категория] — [кол-во]</span>
              </Step>
            </div>
          </section>

          {/* Section 7: Follow-up */}
          <section id="followup" className="scroll-mt-24">
            <SectionHeader num="7" icon={Send} title="Follow-up — что писать кандидату" accent="gold" />
            <p className="text-xs text-[#F8FAFC]/45 mt-2 mb-4">Готовые сообщения для WhatsApp/Telegram. Кнопка 📋 копирует текст.</p>
            <div className="space-y-4">
              {FOLLOWUPS.map((f, i) => (
                <CopyBlock key={i} title={f.title} text={f.text} />
              ))}
            </div>
          </section>

          {/* Section 8: Контакты */}
          <section id="contacts" className="scroll-mt-24">
            <SectionHeader num="8" icon={Phone} title="Контакты и поддержка" accent="purple" />
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {CONTACTS.map(c => (
                <div key={c.title} className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{c.icon}</span>
                    <span className="font-bold text-[#F8FAFC] text-sm">{c.title}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {c.phone && <div className="text-[#C9A84C] font-bold">{c.phone}</div>}
                    {c.email && <div className="text-[#7B3FBF]">{c.email}</div>}
                    {c.hours && <div className="text-[#F8FAFC]/45">{c.hours}</div>}
                    <div className="text-[#F8FAFC]/60 pt-1">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass-card rounded-xl p-4 mt-3">
              <div className="text-xs font-bold text-[#F8FAFC] uppercase tracking-widest mb-3">Email и мессенджеры</div>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2"><Mail size={13} className="text-[#C9A84C]" /> <a href="mailto:partner@bratouverie-snb.ru" className="text-[#F8FAFC]/70 hover:text-[#C9A84C]">partner@bratouverie-snb.ru</a></div>
                <div className="flex items-center gap-2"><Mail size={13} className="text-[#C9A84C]" /> <a href="mailto:hh@vosstanovim-dnr.ru" className="text-[#F8FAFC]/70 hover:text-[#C9A84C]">hh@vosstanovim-dnr.ru</a></div>
                <div className="flex items-center gap-2"><Mail size={13} className="text-[#C9A84C]" /> <a href="mailto:support@bratouverie-snb.ru" className="text-[#F8FAFC]/70 hover:text-[#C9A84C]">support@bratouverie-snb.ru</a></div>
                <div className="flex items-center gap-2"><Phone size={13} className="text-[#7B3FBF]" /> <span className="text-[#F8FAFC]/70">WhatsApp: +7 (4212) 51-59-30</span></div>
              </div>
            </div>
          </section>

          {/* Section 9: Отзывы */}
          <section id="reviews" className="scroll-mt-24">
            <SectionHeader num="9" icon={Star} title="Реальные отзывы — кейсы для убеждения" accent="gold" />
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {REVIEWS.map(r => (
                <div key={r.name} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-bold text-[#F8FAFC] text-sm">{r.name}</div>
                      <div className="text-xs text-[#F8FAFC]/45">{r.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-[#C9A84C]">{r.earned}</div>
                    </div>
                  </div>
                  <p className="text-xs text-[#F8FAFC]/65 leading-relaxed italic">«{r.story}»</p>
                </div>
              ))}
            </div>
            <div className="bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.2)] rounded-lg px-4 py-3 mt-3">
              <div className="text-xs text-[#C9A84C]/80 flex items-center gap-2">
                <Award size={13} /> Используйте эти истории в скрипте: «Я говорил с Максимом, фельдшер из Питера, заработал 1.4 млн...»
              </div>
            </div>
          </section>

          {/* Section 10: FAQ */}
          <section id="faq" className="scroll-mt-24">
            <SectionHeader num="10" icon={HelpCircle} title="FAQ — 10 главных вопросов" accent="purple" />
            <div className="space-y-2 mt-4">
              {FAQ.map((item, i) => (
                <details key={i} className="group bg-[rgba(255,255,255,0.02)] border border-[rgba(123,63,191,0.15)] rounded-lg overflow-hidden">
                  <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none">
                    <span className="text-xs font-mono text-[#7B3FBF]/60 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm font-bold text-[#C9A84C] flex-1">{item.q}</span>
                    <ChevronUp size={14} className="text-[#F8FAFC]/30 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-4 pb-3 pl-10 text-sm text-[#F8FAFC]/70">{item.a}</div>
                </details>
              ))}
            </div>
          </section>

          {/* Section 11: Чеклист */}
          <section id="checklist" className="scroll-mt-24">
            <SectionHeader num="11" icon={CheckSquare} title="Чеклист — готов ли кандидат?" accent="green" />
            <p className="text-xs text-[#F8FAFC]/45 mt-2 mb-4">Отметьте всё, прежде чем передавать кандидата на СБ.</p>
            <Checklist />
          </section>

          {/* Footer */}
          <div className="glass-card rounded-xl px-5 py-4 text-xs text-[#F8FAFC]/40 flex flex-wrap gap-x-6 gap-y-2 pt-4">
            <span>ООО «БРО-СНБ-СНБ» · ОГРН 1262500006966</span>
            <span>📧 <a href="mailto:partner@bratouverie-snb.ru" className="hover:text-[#C9A84C] transition-colors">partner@bratouverie-snb.ru</a></span>
            <span>📞 +7 (4212) 51-59-30 доб. 702</span>
            <span>🔗 <a href="https://bratouverie-snb.base44.app/agency-login" className="hover:text-[#7B3FBF] transition-colors">Войти в CRM</a></span>
          </div>
        </main>
      </div>

      {/* Back to top */}
      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-[#7B3FBF] text-white shadow-lg hover:bg-[#8B4FCF] transition-all z-50 glow-purple">
          <ChevronUp size={20} />
        </button>
      )}
    </div>
  );
}

function SectionHeader({ num, icon: Icon, title, accent }) {
  const colors = {
    purple: 'text-[#7B3FBF] border-[rgba(123,63,191,0.3)]',
    gold: 'text-[#C9A84C] border-[rgba(201,168,76,0.3)]',
    green: 'text-green-400 border-green-500/30',
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors[accent]}`}>
        <span className="text-xs font-mono font-black">{num}</span>
        <Icon size={15} />
      </div>
      <h2 className="text-lg font-black text-[#F8FAFC]">{title}</h2>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }) {
  const colors = {
    purple: 'text-[#7B3FBF]',
    gold: 'text-[#C9A84C]',
    green: 'text-green-400',
  };
  return (
    <div className="glass-card rounded-xl p-4 text-center">
      <Icon size={18} className={`${colors[color]} mx-auto mb-2`} />
      <div className={`text-2xl font-black ${colors[color]}`}>{value}</div>
      <div className="text-xs text-[#F8FAFC]/45 mt-1">{label}</div>
    </div>
  );
}

function ScriptPart({ label, text }) {
  return (
    <div>
      <div className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">{label}</div>
      <CopyBlock text={text} />
    </div>
  );
}

function Step({ num, title, children }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#7B3FBF]/20 border border-[#7B3FBF]/40 flex items-center justify-center text-xs font-black text-[#7B3FBF]">{num}</div>
      <div className="flex-1 pb-3 border-b border-[rgba(255,255,255,0.06)] last:border-0">
        <div className="font-bold text-[#F8FAFC] mb-1 text-sm">{title}</div>
        <div className="text-sm text-[#F8FAFC]/65 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Checklist() {
  const items = [
    'ФИО полностью (как в паспорте)',
    'Дата рождения',
    'Гражданство (РФ / СНГ — индивидуально)',
    'Телефон + WhatsApp/Telegram',
    'Должность определена из списка актуальных',
    'Город проживания',
    'Мотивация выявлена (деньги / опыт / переезд)',
    'Опыт работы записан',
    'Судимость: нет / обсуждается',
    'Воинский учёт: в порядке',
    'Возраст: 19–60 (61–64 — исключения)',
    'Антивозражения отработаны',
    'Согласие на анкету получено',
    'Ссылка на анкету отправлена',
  ];
  const [checked, setChecked] = useState(new Set());
  const toggle = (i) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="grid sm:grid-cols-2 gap-2">
        {items.map((item, i) => (
          <button key={i} onClick={() => toggle(i)}
            className="flex items-center gap-2.5 text-left text-xs p-2 rounded-lg hover:bg-white/5 transition-all">
            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${checked.has(i) ? 'bg-green-500 border-green-500' : 'border-[rgba(255,255,255,0.2)]'}`}>
              {checked.has(i) && <Check size={11} className="text-white" />}
            </div>
            <span className={checked.has(i) ? 'text-[#F8FAFC]/40 line-through' : 'text-[#F8FAFC]/70'}>{item}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] text-xs text-center">
        <span className="text-[#C9A84C] font-bold">{checked.size}</span>
        <span className="text-[#F8FAFC]/40"> / {items.length} — готовность кандидата</span>
        {checked.size === items.length && <span className="text-green-400 font-bold ml-2">✓ Можно передавать на СБ!</span>}
      </div>
    </div>
  );
}
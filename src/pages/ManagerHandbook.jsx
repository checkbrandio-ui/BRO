import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckSquare, AlertTriangle, BookOpen, Users, ClipboardList, MessageSquare, HelpCircle, XCircle, Zap, ArrowRight } from 'lucide-react';

function Section({ icon: Icon, title, children, defaultOpen = false, accent = 'purple' }) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = {
    purple: 'text-[#7B3FBF] border-[rgba(123,63,191,0.3)] bg-[rgba(123,63,191,0.06)]',
    gold: 'text-[#C9A84C] border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.06)]',
    green: 'text-green-400 border-green-500/30 bg-green-500/06',
    red: 'text-red-400 border-red-500/30 bg-red-500/06',
  };
  return (
    <div className={`rounded-xl border overflow-hidden ${colors[accent]}`}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left">
        {Icon && <Icon size={16} className="flex-shrink-0" />}
        <span className="font-bold text-[#F8FAFC] text-sm flex-1">{title}</span>
        {open ? <ChevronUp size={15} className="text-[#F8FAFC]/40" /> : <ChevronDown size={15} className="text-[#F8FAFC]/40" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-3 text-sm text-[#F8FAFC]/75 leading-relaxed">{children}</div>}
    </div>
  );
}

function Step({ num, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#7B3FBF]/20 border border-[#7B3FBF]/40 flex items-center justify-center text-xs font-black text-[#7B3FBF]">{num}</div>
      <div className="flex-1 pb-4 border-b border-[rgba(255,255,255,0.06)] last:border-0">
        <div className="font-bold text-[#F8FAFC] mb-1">{title}</div>
        <div className="text-sm text-[#F8FAFC]/65 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Check({ children }) {
  return (
    <div className="flex items-start gap-2">
      <CheckSquare size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function Warn({ children }) {
  return (
    <div className="flex items-start gap-2 text-red-300/80">
      <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

const CATEGORIES = [
  { icon: '🏗️', title: 'Строители', items: ['Разряд от 3-го', 'Специализация: общестрой / отделка / сантехника / электрика / кровля / монолит', 'Допуски: электробезопасность, высота, газ', 'Опыт на высоте свыше 1,8 м'] },
  { icon: '🔧', title: 'Разнорабочие', items: ['Опыт на стройке (мин. 3–6 мес.)', 'Готовность к физической нагрузке (до 25 кг)', 'Медкнижка (для пищевых)', 'Опыт вахты'] },
  { icon: '🚗', title: 'Водители', items: ['Категория: B / BC / CE / CD', 'Опыт вождения (лет)', 'Тип техники: легковой / грузовой / самосвал / фура / спецтехника', 'ДТП за 3 года, карта тахографа (C,D,CE)'] },
  { icon: '🔩', title: 'Автослесари', items: ['Профиль: легковые / грузовые / спецтехника', 'Диагностика электрики, гидравлика, АКПП', 'Свой инструмент'] },
  { icon: '🛡️', title: 'Охранники', items: ['Удостоверение ЧОП (разряд)', 'Специфика: пост / досмотр / видео / СКУД', 'Ночные смены, режимные объекты'] },
  { icon: '📡', title: 'Инженеры связи', items: ['Профиль: оптоволокно / радиосвязь / IT-сети', 'Группа допуска по электробезопасности', 'Cisco, Huawei, Mikrotik'] },
  { icon: '🚁', title: 'Операторы БПЛА', items: ['Лицензия пилота (обязательно)', 'Тип дронов, опыт применения', 'Работа в условиях ограниченной связи'] },
  { icon: '💣', title: 'Взрывотехники', items: ['Допуск группы А (обязательно)', 'Профиль: промышленный / военный / горный', 'Опыт работы с ВВ (лет)'] },
  { icon: '🩺', title: 'Медработники', items: ['Специализация: фельдшер / медсестра / врач', 'Действующий сертификат (обязательно)', 'Опыт полевой работы'] },
];

const FAQ = [
  { q: 'Это легально?', a: 'Да. Постановление Правительства РФ №2255. Официальное трудоустройство по ТК РФ.' },
  { q: 'Когда придут 2,5 миллиона?', a: 'Первая часть — первая рабочая неделя, вторая — вторая рабочая неделя, на банковскую карту.' },
  { q: 'Нас не мобилизуют?', a: 'Официального освобождения нет, но на уровне командования действует запрет на мобилизацию сотрудников программы.' },
  { q: 'Можно с семьёй?', a: 'Нет. Проживание рассчитано на одного человека. Это вахта, не переезд на ПМЖ.' },
  { q: 'Какой график работы?', a: 'Вахтовый метод, контракт от 3 месяцев. График фиксируется в трудовом договоре.' },
  { q: 'Сколько человек в комнате?', a: 'Условия проживания — на vosstanovim-dnr.ru' },
  { q: 'Компенсация проезда?', a: 'Кандидат едет самостоятельно, билеты сохраняет — компенсация поступает после трудоустройства.' },
];

const ERRORS = [
  ['Незнание условий программы', 'Выучить Разделы 1–2 наизусть'],
  ['Обещание того, чего нет', 'Говорить только то, что есть в программе'],
  ['Непроверка документов', 'Использовать чеклист перед подачей'],
  ['Пропуск дублей', 'Всегда проверять через CRM перед подачей'],
  ['Потеря контакта с кандидатом', 'Фиксировать WhatsApp/Telegram, дублировать напоминания'],
  ['Отправка без готовых документов', 'Перезвонить за 1–2 дня, проверить наличие'],
  ['Обсуждение политики', '«Мы работаем с государственной программой» — и всё'],
];

export default function ManagerHandbook() {
  return (
    <div className="min-h-screen bg-[#05070A] text-[#F8FAFC]">
      {/* Header */}
      <div className="border-b border-[rgba(123,63,191,0.15)] bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png" className="w-7 h-7 object-contain" alt="logo" />
            <span className="text-[rgba(123,63,191,0.4)]">/</span>
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-[#7B3FBF]" />
              <span className="text-sm font-bold text-[#F8FAFC]">Руководство менеджера</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/25">v15.06.2026</span>
          </div>
          <a href="/agency/workspace" className="text-xs text-[#F8FAFC]/40 hover:text-[#7B3FBF] transition-colors">← Назад в рабочую область</a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Hero */}
        <div className="glass-card-gold rounded-2xl px-6 py-5">
          <h1 className="text-xl font-black text-[#F8FAFC] mb-1">Полное руководство по работе с кандидатами</h1>
          <p className="text-sm text-[#F8FAFC]/55">Для менеджеров кадровых агентств — партнёров ООО «Братоуверие-СНБ» · Программа восстановления ЛНР и ДНР</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Зарплата', value: '300 000–470 000 ₽/мес' },
              { label: 'Единовременно', value: '2 500 000 ₽' },
              { label: 'Вахта', value: 'от 3 месяцев' },
            ].map(s => (
              <div key={s.label} className="bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)] rounded-lg px-3 py-2.5">
                <div className="text-xs text-[#F8FAFC]/35 mb-0.5">{s.label}</div>
                <div className="text-sm font-black text-[#C9A84C]">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Раздел 1: CRM */}
        <Section icon={ClipboardList} title="Раздел 1. CRM-система — доступ и работа" defaultOpen={true} accent="purple">
          <div className="space-y-3">
            <p>CRM — единая база данных программы. Агентства вносят кандидатов, отслеживают статусы и получают вознаграждение. Система автоматически проверяет дубли и защищает интересы агентств.</p>

            <div className="bg-[rgba(123,63,191,0.1)] border border-[rgba(123,63,191,0.25)] rounded-lg px-4 py-3 text-xs space-y-1">
              <div className="font-bold text-[#7B3FBF] mb-2">Доступ к CRM</div>
              <div>🔗 <a href="https://bratouverie-snb.base44.app/agency-login" className="text-[#7B3FBF] underline">bratouverie-snb.base44.app/agency-login</a></div>
              <div>📧 Вопросы: <a href="mailto:partner@bratouverie-snb.ru" className="text-[#C9A84C]">partner@bratouverie-snb.ru</a></div>
              <div>📞 <span className="text-[#F8FAFC]/60">+7 (4212) 51-59-30 доб. 702</span></div>
            </div>

            <div className="font-bold text-[#F8FAFC] text-xs uppercase tracking-widest mt-4 mb-2">Что видит агентство в CRM</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Все свои кандидаты с актуальными статусами','Статус проверки СБ и медкомиссии','Даты прибытия и пункты сбора','Сведения о выплатах','Онлайн-анкеты кандидатов','Архив выбывших кандидатов'].map(item => (
                <Check key={item}>{item}</Check>
              ))}
            </div>

            <div className="bg-red-500/8 border border-red-500/25 rounded-lg px-4 py-3 mt-3">
              <div className="font-bold text-red-400 text-xs uppercase tracking-widest mb-2">⚠ Стоп-лист — автоматическая проверка дублей</div>
              <p className="text-xs text-[#F8FAFC]/65 mb-2">При создании карточки CRM сразу проверяет кандидата по ФИО + дата рождения. Если кандидат уже есть в базе от другого агентства — система выдаёт предупреждение и блокирует сохранение. Вознаграждение по дублям не начисляется.</p>
              <div className="space-y-1">
                <Check>Проверил кандидата по ФИО — нет совпадений</Check>
                <Check>Проверил по дате рождения — нет совпадений</Check>
                <Check>При сомнении — сообщил координатору</Check>
              </div>
            </div>
          </div>
        </Section>

        {/* Раздел 2: Полный цикл */}
        <Section icon={Zap} title="Раздел 2. Полный цикл работы с кандидатом" defaultOpen={true} accent="gold">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {['1. Отклик','2. Интервью','3. Карточка в CRM','4. Анкета → кандидату','5. Контроль заполнения','6. Проверка СБ','7. Медкомиссия','8. Оформление'].map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="px-2 py-1 rounded bg-[rgba(201,168,76,0.12)] border border-[rgba(201,168,76,0.2)] text-[#C9A84C]">{s}</span>
                {i < 7 && <ArrowRight size={11} className="text-[#F8FAFC]/25" />}
              </div>
            ))}
          </div>

          <Step num="1" title="Отклик кандидата">
            Зафиксировать контакт: ФИО, телефон, город. Назначить дату интервью. Внести в рабочую таблицу агентства до интервью.
          </Step>

          <Step num="2" title="Телефонное интервью (10–15 мин)">
            <div className="space-y-2">
              <div><span className="text-[#C9A84C] font-bold">0:00–1:00</span> Знакомство. «Добрый день! Меня зовут [Имя], менеджер [Агентство]. Мы сотрудничаем с государственной программой восстановления ЛНР и ДНР…»</div>
              <div><span className="text-[#C9A84C] font-bold">1:00–2:30</span> ФИО полностью, возраст, гражданство, дата рождения.</div>
              <div><span className="text-[#C9A84C] font-bold">2:30–5:00</span> Специализация, опыт, разряды, квалификация.</div>
              <div><span className="text-[#C9A84C] font-bold">5:00–8:00</span> Мотивация. <span className="text-green-400">✓ Доход, вахта, переезд</span> — <span className="text-red-400">✗ «мне всё равно», «без проверок»</span></div>
              <div><span className="text-[#C9A84C] font-bold">8:00–10:00</span> Условия: Мариуполь/Макеевка/Луганск/Алчевск, 300–470 тыс/мес + 2,5 млн, ТК РФ, проживание и питание бесплатно, проезд компенсируется.</div>
              <div><span className="text-[#C9A84C] font-bold">10:00–12:00</span> Ограничения: здоровье, семья, судимость, воинский учёт, документы.</div>
              <div><span className="text-[#C9A84C] font-bold">12:00–15:00</span> «Внесу в CRM, вы получите анкету, после проверки — дата медкомиссии, потом оформление и отправка.»</div>
            </div>
          </Step>

          <Step num="3" title="Создание карточки в CRM (в течение 1 часа после интервью)">
            <div className="space-y-2">
              <p className="text-[#F8FAFC]/80">Нажмите <strong className="text-[#7B3FBF]">«Добавить кандидата»</strong> и заполните минимальный набор данных:</p>
              <div className="bg-[rgba(123,63,191,0.08)] border border-[rgba(123,63,191,0.2)] rounded-lg p-3 text-xs space-y-1">
                <Check>ФИО (полностью)</Check>
                <Check>Дата рождения — <span className="text-[#C9A84C]">важна для стоп-листа</span></Check>
                <Check>Телефон</Check>
                <Check>Должность / специализация</Check>
                <Check>Город проживания</Check>
              </div>
              <p className="text-xs text-[#F8FAFC]/50">Остальные данные кандидат заполнит сам в онлайн-анкете.</p>
            </div>
          </Step>

          <Step num="4" title="Отправка ссылки на анкету кандидату">
            <div className="space-y-2">
              <p>После создания карточки система автоматически формирует уникальную ссылку на онлайн-анкету. Скопируйте её и отправьте кандидату в WhatsApp/Telegram.</p>
              <div className="bg-[rgba(123,63,191,0.08)] border border-[rgba(123,63,191,0.2)] rounded-lg p-3 text-xs space-y-1.5">
                <div className="font-bold text-[#7B3FBF] mb-1">Как скопировать ссылку:</div>
                <div>1. В строке кандидата найдите колонку <strong>«Анкета»</strong></div>
                <div>2. Нажмите иконку <strong>📋 (копировать)</strong> — ссылка скопируется в буфер</div>
                <div>3. Отправьте кандидату в мессенджере с пояснением:</div>
                <div className="bg-[#0D1B3E] rounded p-2 text-[#F8FAFC]/70 italic mt-1">«Добрый день! Вот ваша личная анкета для участия в программе. Пожалуйста, заполните все поля и загрузите документы. Это займёт около 15 минут. [ссылка]»</div>
              </div>
            </div>
          </Step>

          <Step num="5" title="Контроль заполнения анкеты">
            <div className="space-y-2">
              <p>В таблице CRM статус анкеты отображается в колонке <strong>«Анкета»</strong>:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded px-3 py-2">
                  <span className="text-[#C9A84C] font-bold">Ожидает</span> — ссылка отправлена, анкета не заполнена
                </div>
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
                  <span className="text-green-400 font-bold">✓ Заполнена</span> — все данные получены, можно передавать
                </div>
              </div>
              <p className="text-xs text-[#F8FAFC]/50">Если кандидат не заполнил анкету в течение 2 дней — напомните ему лично.</p>
            </div>
          </Step>

          <Step num="6" title="После заполнения анкеты — передача на проверку СБ">
            <div className="space-y-2">
              <p>Когда статус анкеты <span className="text-green-400 font-bold">«✓ Заполнена»</span> — все персональные данные кандидата автоматически обновляются в его карточке. Дополнительно переносить данные вручную не нужно.</p>
              <p>Сообщите координатору о готовности кандидата по теме письма:</p>
              <div className="bg-[#0D1B3E] rounded px-3 py-2 text-xs text-[#F8FAFC]/70 italic">
                [Название агентства] — Заявка — [ФИО] — [категория] — [кол-во]
              </div>
              <p className="text-xs text-[#F8FAFC]/50">Координатор проводит проверку СБ и назначает пункт сбора — статусы обновятся в CRM.</p>
            </div>
          </Step>

          <Step num="7" title="Медкомиссия">
            Координатор назначает дату и место. После прохождения — связаться с кандидатом, уточнить результат. Если не прошёл — сообщить координатору. Статус в CRM обновляется администратором.
          </Step>

          <Step num="8" title="Оформление и отправка на объект">
            Координатор подтверждает оформление → сообщить кандидату дату и место (база в г. Макеевка, ДНР). Проезд компенсируется после трудоустройства — билеты сохранить. Отметить статус в CRM.
          </Step>
        </Section>

        {/* Раздел 3: Вопросы по категориям */}
        <Section icon={Users} title="Раздел 3. Дополнительные вопросы по категориям" accent="purple">
          <div className="grid sm:grid-cols-2 gap-3">
            {CATEGORIES.map(cat => (
              <div key={cat.title} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(123,63,191,0.15)] rounded-lg p-3">
                <div className="font-bold text-[#F8FAFC] text-sm mb-2">{cat.icon} {cat.title}</div>
                <ul className="space-y-1">
                  {cat.items.map(item => (
                    <li key={item} className="text-xs text-[#F8FAFC]/60 flex items-start gap-1.5">
                      <span className="text-[#7B3FBF] mt-0.5">·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* Раздел 4: Типичные ошибки */}
        <Section icon={XCircle} title="Раздел 4. Типичные ошибки менеджера" accent="red">
          <div className="space-y-2">
            {ERRORS.map(([err, fix]) => (
              <div key={err} className="flex gap-3 text-xs p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg">
                <Warn>{err}</Warn>
                <ArrowRight size={12} className="text-[#F8FAFC]/25 flex-shrink-0 mt-0.5" />
                <span className="text-green-400/80">{fix}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Раздел 5: FAQ */}
        <Section icon={HelpCircle} title="Раздел 5. Ответы на вопросы кандидатов" accent="gold">
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="border-b border-[rgba(255,255,255,0.06)] pb-3 last:border-0">
                <div className="font-bold text-[#C9A84C] text-sm mb-1">В: {q}</div>
                <div className="text-sm text-[#F8FAFC]/70">О: {a}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Раздел 6: Скрипт */}
        <Section icon={MessageSquare} title="Раздел 6. Скрипт звонка — шаблон" accent="purple">
          <div className="space-y-3 text-sm">
            <div className="bg-[rgba(123,63,191,0.08)] border border-[rgba(123,63,191,0.2)] rounded-lg p-4 italic text-[#F8FAFC]/75 leading-relaxed">
              «Добрый день! Меня зовут [Имя], менеджер по подбору персонала [название агентства]. Мы сотрудничаем с государственной программой восстановления ЛНР и ДНР — строительство и восстановление инфраструктуры на освобождённых территориях. У нас есть вакансии для [категория специалиста]. Можно уделить вам 10–15 минут?»
            </div>
            <div className="bg-[rgba(123,63,191,0.08)] border border-[rgba(123,63,191,0.2)] rounded-lg p-4 italic text-[#F8FAFC]/75 leading-relaxed">
              «Что дальше: внесу ваши данные в CRM, вы получите персональную анкету по ссылке, заполнить за 15 минут, после проверки назначим дату медкомиссии, медкомиссия один день, после неё — оформление и отправка на объект.»
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="glass-card rounded-xl px-5 py-4 text-xs text-[#F8FAFC]/40 flex flex-wrap gap-x-6 gap-y-2">
          <span>ООО «Братоуверие-СНБ» · ОГРН 1262500006966 · ИНН 2511135442</span>
          <span>📧 <a href="mailto:partner@bratouverie-snb.ru" className="hover:text-[#C9A84C] transition-colors">partner@bratouverie-snb.ru</a></span>
          <span>📞 +7 (4212) 51-59-30 доб. 702</span>
          <span>🔗 <a href="https://bratouverie-snb.base44.app/agency-login" className="hover:text-[#7B3FBF] transition-colors">Войти в CRM</a></span>
        </div>
      </div>
    </div>
  );
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================
// РЕКВИЗИТЫ ООО «БРО-СНБ» — заполни реальными данными
// ============================================================
const COMPANY = {
  name: 'ООО «БРО-СНБ»',
  short_name: 'БРО-СНБ',
  inn: '[ИНН]',
  ogrn: '[ОГРН]',
  kpp: '[КПП]',
  address: '[Юридический адрес]',
  director: '[ФИО руководителя]',
  director_short: '[ФИО рук.]',
  phone: '[Телефон]',
  email: '[Email]',
  bank: '[Наименование банка]',
  account: '[Расчётный счёт]',
  bik: '[БИК]',
  corr_account: '[Корр. счёт]',
};

// ============================================================
// ОБЯЗАННОСТИ ПО ДОЛЖНОСТЯМ (6 позиций)
// ============================================================
const POSITION_DUTIES = {
  'Разнорабочий': [
    'выполнение подсобных и вспомогательных работ на объекте и прилегающей территории',
    'погрузочно-разгрузочные работы, перемещение строительных материалов и оборудования',
    'уборка строительного мусора и поддержание порядка на рабочем месте',
    'подготовка инструментов и приспособлений к работе, их очистка и сдача после смены',
    'оказание помощи основным рабочим при выполнении специализированных задач',
    'соблюдение требований охраны труда, техники безопасности и пожарной безопасности',
  ],
  'Строитель': [
    'выполнение бетонных, арматурных и опалубочных работ в соответствии с проектной документацией',
    'кладка кирпичных и блочных конструкций, монтаж железобетонных изделий',
    'монтаж и демонтаж строительных конструкций и временных сооружений',
    'контроль качества выполняемых работ, выявление и устранение дефектов',
    'чтение строительных чертежей и схем, соблюдение технологических карт',
    'содержание инструментов, механизмов и оборудования в исправном состоянии',
  ],
  'Водитель': [
    'управление закреплённым транспортным средством, обеспечение его безопасной эксплуатации',
    'доставка грузов и персонала к месту назначения по заданным маршрутам',
    'ведение путевых листов, учёт расхода горюче-смазочных материалов',
    'контроль технического состояния транспортного средства перед выездом и по возвращении',
    'своевременное прохождение технического обслуживания и ремонта автомобиля',
    'соблюдение правил дорожного движения, обеспечение сохранности груза при транспортировке',
  ],
  'Автослесарь': [
    'техническое обслуживание и ремонт автомобильной и специальной техники',
    'диагностика неисправностей узлов, агрегатов и электронных систем',
    'замена и ремонт деталей, узлов и агрегатов в соответствии с технической документацией',
    'ведение журнала учёта ремонтных работ и расхода запасных частей',
    'содержание инструмента и ремонтного оборудования в исправном состоянии',
    'контроль качества запасных частей и расходных материалов, соблюдение требований охраны труда',
  ],
  'Медицинский работник': [
    'оказание первой и неотложной медицинской помощи работникам объекта',
    'ведение медицинской документации, журналов учёта и отчётных форм',
    'контроль санитарно-эпидемиологического состояния объекта и бытовых помещений',
    'проведение предсменных и периодических медицинских осмотров персонала',
    'контроль хранения, учёта и использования медикаментов и расходных материалов',
    'взаимодействие с профильными медицинскими учреждениями, соблюдение врачебной тайны',
  ],
  'Охранник': [
    'обеспечение контрольно-пропускного режима и охраны объекта',
    'контроль доступа на территорию объекта, проверка документов у посетителей',
    'патрулирование периметра и прилегающей территории по установленному маршруту',
    'ведение журнала учёта посетителей, транспорта и материальных ценностей',
    'пресечение нарушений режима, оперативное реагирование на нештатные ситуации',
    'контроль работоспособности технических средств охраны и сигнализации',
  ],
};

function getPositionKey(position) {
  if (!position) return 'Разнорабочий';
  if (position.startsWith('Водитель')) return 'Водитель';
  if (POSITION_DUTIES[position]) return position;
  return 'Разнорабочий';
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dutiesList(position) {
  const key = getPositionKey(position);
  const duties = POSITION_DUTIES[key] || POSITION_DUTIES['Разнорабочий'];
  return duties.map(d => `<li>${escapeHtml(d)}</li>`).join('\n');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return escapeHtml(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return escapeHtml(dateStr); }
}

// ============================================================
// HTML-ОБЁРТКА ДЛЯ ПЕЧАТИ
// ============================================================
function wrapHTML(title, body) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 2cm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  h1 { font-size: 14pt; text-align: center; text-transform: uppercase; margin: 0 0 0.5cm 0; }
  h2 { font-size: 12pt; margin: 0.8cm 0 0.3cm 0; }
  p { text-indent: 1.25cm; text-align: justify; margin: 0.3cm 0; }
  p.no-indent { text-indent: 0; }
  p.right { text-align: right; text-indent: 0; }
  p.center { text-align: center; text-indent: 0; }
  .header { text-align: center; margin-bottom: 0.8cm; }
  .company-name { font-weight: bold; font-size: 13pt; }
  .company-info { font-size: 10pt; margin-top: 0.2cm; }
  ul { padding-left: 1.25cm; margin: 0.3cm 0; }
  li { text-align: justify; margin: 0.15cm 0; }
  table { width: 100%; border-collapse: collapse; }
  table.bordered td { padding: 0.2cm; vertical-align: top; border: 1px solid #000; }
  table.signatures { width: 100%; border: none; margin-top: 1.5cm; }
  table.signatures td { border: none; padding: 0.3cm; vertical-align: top; }
  .sign-line { border-bottom: 1px solid #000; display: inline-block; min-width: 5cm; }
  .doc-number { text-align: right; text-indent: 0; font-size: 11pt; }
  .section-title { font-weight: bold; text-transform: uppercase; text-indent: 0; margin-top: 0.6cm; }
  .muted { font-size: 10pt; color: #333; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

// ============================================================
// ШАБЛОН: ТРУДОВОЙ ДОГОВОР
// ============================================================
function buildTrudovoyDogovor(ctx) {
  const posKey = getPositionKey(ctx.position);
  const dutiesHtml = dutiesList(ctx.position);

  return wrapHTML('Трудовой договор', `
  <div class="header">
    <div class="company-name">${COMPANY.name}</div>
    <div class="company-info">${escapeHtml(COMPANY.address)}</div>
    <div class="company-info">ИНН: ${escapeHtml(COMPANY.inn)} · ОГРН: ${escapeHtml(COMPANY.ogrn)} · КПП: ${escapeHtml(COMPANY.kpp)}</div>
  </div>

  <p class="doc-number">г. ${escapeHtml(ctx.city || '—')} · «___» _________ 20___ г.</p>

  <h1>Трудовой договор № ___</h1>

  <p class="no-indent">${COMPANY.name}, в лице ${escapeHtml(COMPANY.director)}, действующего на основании Устава, именуемое в дальнейшем «Работодатель», с одной стороны, и</p>

  <p class="no-indent">гражданин <strong>${escapeHtml(ctx.full_name)}</strong>, дата рождения: ${formatDate(ctx.birth_date)}, место рождения: ${escapeHtml(ctx.birth_place || '—')}, паспорт: серия ${escapeHtml(ctx.passport_series)} № ${escapeHtml(ctx.passport_number)}, выдан ${escapeHtml(ctx.passport_issued_by)} ${formatDate(ctx.passport_issued_date)}, код подразделения: ${escapeHtml(ctx.passport_dept_code)}, зарегистрированный по адресу: ${escapeHtml(ctx.registration_address)}, именуемый в дальнейшем «Работник», с другой стороны, заключили настоящий трудовой договор о нижеследующем.</p>

  <p class="section-title">1. Предмет договора</p>
  <p>Работодатель обязуется предоставить Работнику работу по должности <strong>${escapeHtml(ctx.position || posKey)}</strong>, обеспечить условия труда, предусмотренные трудовым законодательством, своевременно выплачивать заработную плату, а Работник обязуется лично выполнять трудовые обязанности и соблюдать правила внутреннего трудового распорядка.</p>
  <p>Работа у Работодателя является основной. Место работы: объекты восстановления инфраструктуры, расположенные на территории, определяемой Работодателем.</p>

  <p class="section-title">2. Обязанности Работника</p>
  <p class="no-indent">Работник обязан:</p>
  <ul>
    ${dutiesHtml}
    <li>добросовестно исполнять свои трудовые обязанности, возложенные настоящим договором</li>
    <li>соблюдать трудовую дисциплину, правила внутреннего трудового распорядка и инструкции по охране труда</li>
    <li>выполнять установленные нормы труда и нормы рабочего времени</li>
    <li>бережно относиться к имуществу Работодателя и обеспечивать его сохранность</li>
    <li>незамедлительно сообщать Работодателю о возникновении ситуации, представляющей угрозу жизни и здоровью людей</li>
  </ul>

  <p class="section-title">3. Обязанности Работодателя</p>
  <p class="no-indent">Работодатель обязан:</p>
  <ul>
    <li>предоставить Работнику работу, обусловленную настоящим договором</li>
    <li>обеспечить безопасность труда и условия, отвечающие требованиям охраны труда</li>
    <li>выплачивать в полном размере и в установленные сроки заработную плату</li>
    <li>обеспечивать Работника оборудованием, инструментами, технической документацией и иными средствами, необходимыми для исполнения трудовых обязанностей</li>
    <li>осуществлять обязательное социальное и медицинское страхование Работника</li>
  </ul>

  <p class="section-title">4. Режим рабочего времени</p>
  <p>Работнику устанавливается вахтовый метод работы. Режим труда и отдыха определяется графиком работы, утверждаемым Работодателем. Продолжительность рабочей недели — не более 40 часов. Продолжительность вахты — не более одного месяца. Перерыв для отдыха и питания — не менее 30 минут в течение рабочего дня.</p>

  <p class="section-title">5. Оплата труда</p>
  <p>За выполнение трудовых обязанностей Работнику устанавливается заработная плата в размере, определяемом дополнительным соглашением. Выплата заработной платы производится не реже чем каждые полмесяца в установленные Работодателем сроки.</p>

  <p class="section-title">6. Срок договора</p>
  <p>Настоящий договор заключён на срок с «___» _________ 20___ г. по «___» _________ 20___ г. Основание заключения срочного трудового договора — направление на работу вахтовым методом на объекты восстановления инфраструктуры.</p>

  <p class="section-title">7. Ответственность сторон</p>
  <p>Стороны несут ответственность за неисполнение или ненадлежащее исполнение обязанностей по настоящему договору в соответствии с действующим законодательством Российской Федерации. Работник несёт материальную ответственность за прямой действительный ущерб, причинённый Работодателю.</p>

  <p class="section-title">8. Заключительные положения</p>
  <p>Настоящий договор вступает в силу с момента подписания обеими сторонами. Все изменения и дополнения оформляются в письменном виде. Споры разрешаются в соответствии с действующим законодательством. Во всём остальном, не предусмотренном настоящим договором, стороны руководствуются Трудовым кодексом Российской Федерации.</p>

  <table class="signatures">
    <tr>
      <td style="width:50%">
        <p class="no-indent"><strong>Работодатель:</strong></p>
        <p class="no-indent muted">${COMPANY.name}</p>
        <p class="no-indent">ИНН: ${escapeHtml(COMPANY.inn)}</p>
        <p class="no-indent">${escapeHtml(COMPANY.address)}</p>
        <p class="no-indent">________________ / ${escapeHtml(COMPANY.director_short)} /</p>
        <p class="no-indent muted">М.П.</p>
      </td>
      <td style="width:50%">
        <p class="no-indent"><strong>Работник:</strong></p>
        <p class="no-indent">${escapeHtml(ctx.full_name)}</p>
        <p class="no-indent">Паспорт: ${escapeHtml(ctx.passport_series)} ${escapeHtml(ctx.passport_number)}</p>
        <p class="no-indent">${escapeHtml(ctx.registration_address)}</p>
        <p class="no-indent">Тел.: ${escapeHtml(ctx.phone || '—')}</p>
        <p class="no-indent">________________ / ${escapeHtml(ctx.full_name)} /</p>
      </td>
    </tr>
  </table>
  `);
}

// ============================================================
// ШАБЛОН: СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ
// ============================================================
function buildConsentPD(ctx) {
  return wrapHTML('Согласие на обработку персональных данных', `
  <div class="header">
    <div class="company-name">${COMPANY.name}</div>
  </div>

  <h1>Согласие на обработку персональных данных</h1>

  <p class="no-indent">Я, <strong>${escapeHtml(ctx.full_name)}</strong>, паспорт: серия ${escapeHtml(ctx.passport_series)} № ${escapeHtml(ctx.passport_number)}, выдан ${escapeHtml(ctx.passport_issued_by)} ${formatDate(ctx.passport_issued_date)}, код подразделения: ${escapeHtml(ctx.passport_dept_code)}, зарегистрированный по адресу: ${escapeHtml(ctx.registration_address)},</p>

  <p>свободно, своей волей и в своём интересе даю согласие ${COMPANY.name} (ИНН: ${escapeHtml(COMPANY.inn)}, ОГРН: ${escapeHtml(COMPANY.ogrn)}, адрес: ${escapeHtml(COMPANY.address)}) на обработку моих персональных данных в соответствии со статьёй 9 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных».</p>

  <p class="section-title">Перечень обрабатываемых персональных данных:</p>
  <ul>
    <li>фамилия, имя, отчество</li>
    <li>дата и место рождения</li>
    <li>гражданство</li>
    <li>данные документа, удостоверяющего личность (серия, номер, дата выдачи, кем выдан, код подразделения)</li>
    <li>адрес регистрации и фактического проживания</li>
    <li>контактные данные (телефон, адрес электронной почты)</li>
    <li>сведения об образовании, квалификации и профессиональной подготовке</li>
    <li>сведения о трудовой деятельности и опыте работы</li>
    <li>сведения о здоровье, необходимые для определения пригодности к выполнению трудовых обязанностей</li>
  </ul>

  <p class="section-title">Цели обработки:</p>
  <ul>
    <li>заключение и исполнение трудового договора</li>
    <li>оформление допуска к работе на режимных объектах</li>
    <li>обеспечение пропускного режима и безопасности</li>
    <li>ведение кадрового учёта и формирование личного дела</li>
    <li>предоставление сведений в государственные органы в установленных законом случаях</li>
  </ul>

  <p>Настоящее согласие действует со дня его подписания до дня отзыва в письменной форме. Я уведомлён о праве отозвать согласие путём направления письменного заявления. Отзыв согласия не влияет на обработку данных, осуществлённую до момента отзыва.</p>

  <table class="signatures">
    <tr>
      <td style="width:100%">
        <p class="no-indent">«___» _________ 20___ г.</p>
        <p class="no-indent">________________ / ${escapeHtml(ctx.full_name)} /</p>
      </td>
    </tr>
  </table>
  `);
}

// ============================================================
// ШАБЛОН: РАСПИСКА-ОБЯЗАТЕЛЬСТВО (LEGAL SHIELD)
// ============================================================
function buildRaspiska(ctx) {
  return wrapHTML('Расписка-обязательство', `
  <div class="header">
    <div class="company-name">${COMPANY.name}</div>
  </div>

  <h1>Расписка-обязательство</h1>

  <p class="no-indent">Я, <strong>${escapeHtml(ctx.full_name)}</strong>, паспорт: серия ${escapeHtml(ctx.passport_series)} № ${escapeHtml(ctx.passport_number)}, выдан ${escapeHtml(ctx.passport_issued_by)} ${formatDate(ctx.passport_issued_date)}, код подразделения: ${escapeHtml(ctx.passport_dept_code)}, зарегистрированный по адресу: ${escapeHtml(ctx.registration_address)},</p>

  <p class="section-title">Добровольно и в здравом уме подтверждаю следующее:</p>

  <p class="no-indent">1. Я ознакомлен с условиями трудовой деятельности вахтовым методом на объектах восстановления инфраструктуры. Я понимаю характер и специфику работы, включая удалённость объектов, режимные требования и условия проживания.</p>

  <p class="no-indent">2. Я добровольно соглашаюсь с установленной процедурой оформления: прохождением проверки, медицинского освидетельствования и согласованием логистики прибытия к месту работы. Я осознаю, что эти этапы необходимы для моей безопасности и легального трудоустройства.</p>

  <p class="no-indent">3. Я подтверждаю, что все представленные мной документы и сведения являются достоверными. Я предупреждён о том, что предоставление заведомо ложных сведений является основанием для расторжения трудового договора и привлечения к ответственности.</p>

  <p class="no-indent">4. Я согласен с тем, что выплата причитающихся мне сумм производится в соответствии с условиями трудового договора после прохождения всех этапов оформления и прибытия на объект. Я не имею материальных или иных претензий к работодателю на период до прибытия на объект, за исключением случаев, прямо предусмотренных законом.</p>

  <p class="no-indent">5. Я обязуюсь соблюдать правила внутреннего трудового распорядка, требования охраны труда и режимные ограничения, установленные на объекте. Я предупреждён, что нарушение режимных требований может повлечь немедленное расторжение трудового договора.</p>

  <p class="no-indent">6. Я уведомлён о порядке и сроках выплаты заработной платы. Я подтверждаю, что мне разъяснены все существенные условия трудового договора и я не имею дополнительных вопросов.</p>

  <p class="section-title">Я подтвердила/подтвердил, что прочитал и понял каждый пункт.</p>

  <table class="signatures">
    <tr>
      <td style="width:100%">
        <p class="no-indent">«___» _________ 20___ г.</p>
        <p class="no-indent">г. ${escapeHtml(ctx.city || '—')}</p>
        <p class="no-indent">________________ / ${escapeHtml(ctx.full_name)} /</p>
      </td>
    </tr>
  </table>
  `);
}

// ============================================================
// ШАБЛОН: СОГЛАШЕНИЕ О НЕРАЗГЛАШЕНИИ (NDA)
// ============================================================
function buildNDA(ctx) {
  return wrapHTML('Соглашение о неразглашении', `
  <div class="header">
    <div class="company-name">${COMPANY.name}</div>
    <div class="company-info">ИНН: ${escapeHtml(COMPANY.inn)} · ОГРН: ${escapeHtml(COMPANY.ogrn)}</div>
  </div>

  <h1>Соглашение о неразглашении конфиденциальной информации</h1>

  <p class="doc-number">г. ${escapeHtml(ctx.city || '—')} · «___» _________ 20___ г.</p>

  <p class="no-indent">${COMPANY.name}, в лице ${escapeHtml(COMPANY.director)}, действующего на основании Устава, именуемое «Работодатель», с одной стороны, и</p>

  <p class="no-indent">гражданин <strong>${escapeHtml(ctx.full_name)}</strong>, паспорт: серия ${escapeHtml(ctx.passport_series)} № ${escapeHtml(ctx.passport_number)}, именуемый «Работник», с другой стороны, заключили настоящее соглашение о нижеследующем.</p>

  <p class="section-title">1. Предмет соглашения</p>
  <p>Работник обязуется не разглашать конфиденциальную информацию, ставшую известной ему в связи с выполнением трудовых обязанностей на режимных объектах Работодателя.</p>

  <p class="section-title">2. Перечень конфиденциальной информации</p>
  <ul>
    <li>сведения о местоположении объектов, их структуре и охраняемых периметрах</li>
    <li>сведения о личном составе, численности и графике работы персонала объекта</li>
    <li>сведения о технических средствах охраны, системах контроля доступа и сигнализации</li>
    <li>сведения о маршрутах доставки материалов, логистике и транспортных схемах</li>
    <li>внутренние инструкции, регламенты и распорядительные документы Работодателя</li>
    <li>любая иная информация, отнесённая Работодателем к конфиденциальной</li>
  </ul>

  <p class="section-title">3. Обязательства Работника</p>
  <p>Работник обязуется не передавать конфиденциальную информацию третьим лицам, не использовать её в личных целях, не осуществлять фото- и видеосъёмку на территории объекта без письменного разрешения Работодателя, а также принимать все необходимые меры для предотвращения несанкционированного доступа к конфиденциальной информации.</p>

  <p class="section-title">4. Ответственность</p>
  <p>В случае разглашения конфиденциальной информации Работник несёт ответственность в соответствии с действующим законодательством Российской Федерации. Разглашение конфиденциальной информации является основанием для расторжения трудового договора и привлечения Работника к гражданско-правовой и уголовной ответственности.</p>

  <p class="section-title">5. Срок действия</p>
  <p>Обязательство о неразглашении действует в течение всего срока трудового договора и в течение 3 (трёх) лет после его прекращения.</p>

  <table class="signatures">
    <tr>
      <td style="width:50%">
        <p class="no-indent"><strong>Работодатель:</strong></p>
        <p class="no-indent">${COMPANY.name}</p>
        <p class="no-indent">________________ / ${escapeHtml(COMPANY.director_short)} /</p>
        <p class="no-indent muted">М.П.</p>
      </td>
      <td style="width:50%">
        <p class="no-indent"><strong>Работник:</strong></p>
        <p class="no-indent">${escapeHtml(ctx.full_name)}</p>
        <p class="no-indent">________________ / ${escapeHtml(ctx.full_name)} /</p>
      </td>
    </tr>
  </table>
  `);
}

// ============================================================
// МАРШРУТИЗАЦИЯ ШАБЛОНОВ
// ============================================================
const TEMPLATES = {
  trudovoy_dogovor: buildTrudovoyDogovor,
  consent_pd: buildConsentPD,
  raspiska: buildRaspiska,
  nda: buildNDA,
};

// ============================================================
// ОСНОВНОЙ ОБРАБОТЧИК
// ============================================================
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Не авторизован' }, { status: 401 });

    const body = await req.json();
    const { candidate_id, document_type } = body;

    if (!candidate_id) return Response.json({ error: 'Не указан candidate_id' }, { status: 400 });
    if (!TEMPLATES[document_type]) return Response.json({ error: 'Неизвестный тип документа: ' + document_type }, { status: 400 });

    // Загружаем кандидата
    const candidate = await base44.asServiceRole.entities.Candidate.get(candidate_id);
    if (!candidate) return Response.json({ error: 'Кандидат не найден' }, { status: 404 });

    // Загружаем анкету
    let formData = {};
    try {
      const forms = await base44.asServiceRole.entities.CandidateForm.filter({ candidate_id });
      const form = forms.find(f => f.status === 'completed') || forms[0];
      if (form) formData = form;
    } catch {}

    // Сливаем данные (приоритет — форме, т.к. там паспортные данные)
    const ctx = {
      full_name: candidate.full_name || formData.full_name || '',
      birth_date: candidate.birth_date || formData.birth_date || '',
      birth_place: candidate.birth_place || formData.birth_place || '',
      citizenship: candidate.citizenship || formData.citizenship || '',
      position: candidate.position || formData.position || '',
      city: candidate.city || formData.city || '',
      phone: candidate.phone || formData.phone || '',
      email: candidate.email || formData.email || '',
      registration_address: formData.registration_address || '',
      actual_address: formData.actual_address || '',
      passport_series: formData.passport_series || '',
      passport_number: formData.passport_number || '',
      passport_issued_by: formData.passport_issued_by || '',
      passport_issued_date: formData.passport_issued_date || '',
      passport_dept_code: formData.passport_dept_code || '',
      migration_card_number: formData.migration_card_number || '',
      patent_number: formData.patent_number || '',
      assembly_point: candidate.assembly_point || formData.assembly_point || '',
      arrival_date: candidate.arrival_date || formData.arrival_date || '',
      arrival_time: candidate.arrival_time || formData.arrival_time || '',
      agency_name: candidate.agency_name || '',
      today: new Date().toLocaleDateString('ru-RU'),
    };

    const html = TEMPLATES[document_type](ctx);
    const filename = `${document_type}_${ctx.full_name || 'document'}.html`;

    return Response.json({ html, filename, ctx });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
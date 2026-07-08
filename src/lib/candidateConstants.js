// Список гражданств: РФ + страны СНГ
export const CITIZENSHIPS = [
  'РФ', 'РБ', 'Казахстан', 'Узбекистан', 'Таджикистан',
  'Киргизия', 'Туркменистан', 'Азербайджан', 'Армения', 'Молдова', 'Украина',
];

// Проверка: является ли гражданство СНГ (всё, что не РФ)
export function isCIS(citizenship) {
  return !!citizenship && citizenship !== 'РФ';
}

// Поля СНГ (показываются только для неграждан РФ)
export const CIS_FIELDS = [
  { key: 'migration_card_number', label: 'Номер миграционной карты', placeholder: '1234 567890' },
  { key: 'migration_card_expiry', label: 'Срок действия мигр. карты', placeholder: 'дд.мм.гггг' },
  { key: 'patent_number', label: 'Номер патента на работу', placeholder: '1234567890' },
  { key: 'patent_region', label: 'Регион выдачи патента', placeholder: 'г. Москва' },
];

// Типы документов для СНГ (добавляются к основным)
export const CIS_DOC_TYPES = [
  { id: 'migration_card', label: 'Миграционная карта', required: false },
  { id: 'patent', label: 'Патент на работу', required: false },
  { id: 'passport_translation', label: 'Нотариальный перевод паспорта', required: false },
];

// Статусы логистики
export const LOGISTICS_STATUS = {
  none: { label: 'Не начато', color: 'text-[#F8FAFC]/30', bg: 'bg-[#F8FAFC]/5', icon: '○' },
  pending_admin: { label: 'Ожидает админа', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '⏳' },
  pending_candidate: { label: 'Ожидает кандидата', color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10', icon: '⏳' },
  confirmed: { label: 'Подтверждено', color: 'text-green-400', bg: 'bg-green-500/10', icon: '✓' },
};

// Цвета badge-фильтров для статусов СБ
export const SB_BADGE = {
  'Не проверялся': { color: 'text-[#F8FAFC]/40', bg: 'bg-[#F8FAFC]/5', border: 'border-[#F8FAFC]/10', icon: '○' },
  'На проверке': { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: '⏳' },
  'Согласован': { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: '✓' },
  'Не согласован': { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '✗' },
};

// Цвета badge-фильтров для медкомиссии
export const MED_BADGE = {
  'Не проверялся': { color: 'text-[#F8FAFC]/40', bg: 'bg-[#F8FAFC]/5', border: 'border-[#F8FAFC]/10', icon: '○' },
  'Прошёл': { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: '✓' },
  'Не прошёл': { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '✗' },
};

// Формирование текстового отчёта для СБ (для копирования в мессенджер)
export function buildSbReport(candidate, formDocs, candidateFormData) {
  const lines = [];
  const fmt = (v) => v || '—';

  lines.push('📋 Данные кандидата для СБ');
  lines.push('');
  lines.push(`👤 ФИО: ${fmt(candidate.full_name)}`);
  lines.push(`📅 Дата рождения: ${fmt(candidate.birth_date)}`);
  lines.push(`🌍 Гражданство: ${fmt(candidate.citizenship)}`);
  lines.push(`📍 Место рождения: ${fmt(candidate.birth_place)}`);
  lines.push(`📍 Город проживания: ${fmt(candidate.city)}`);
  lines.push(`💼 Должность: ${fmt(candidate.position)}`);
  lines.push(`📞 Телефон: ${fmt(candidate.phone)}`);
  if (candidate.email) lines.push(`✉️ Email: ${candidate.email}`);

  // Паспортные данные (из анкеты, если есть)
  if (candidateFormData) {
    const fd = candidateFormData;
    if (fd.passport_series || fd.passport_number) {
      lines.push(`📄 Паспорт: ${fmt(fd.passport_series)} ${fmt(fd.passport_number)}`);
    }
    if (fd.passport_issued_by) {
      lines.push(`📄 Кем выдан: ${fd.passport_issued_by}`);
    }
    if (fd.passport_issued_date) {
      lines.push(`📄 Дата выдачи: ${fd.passport_issued_date}`);
    }
    if (fd.registration_address) {
      lines.push(`🏠 Адрес регистрации: ${fd.registration_address}`);
    }
    // СНГ-специфичные поля
    if (isCIS(candidate.citizenship)) {
      if (fd.migration_card_number) lines.push(`📝 Миграционная карта: ${fd.migration_card_number}`);
      if (fd.migration_card_expiry) lines.push(`📝 Срок мигр. карты: ${fd.migration_card_expiry}`);
      if (fd.patent_number) lines.push(`📝 Патент: ${fd.patent_number}`);
      if (fd.patent_region) lines.push(`📝 Регион патента: ${fd.patent_region}`);
    }
  }

  // Логистика
  if (candidate.assembly_point || candidate.arrival_date) {
    lines.push('');
    lines.push('🚛 Логистика:');
    if (candidate.assembly_point) lines.push(`📍 Пункт сбора: ${candidate.assembly_point}`);
    if (candidate.arrival_date) lines.push(`📅 Дата прибытия: ${candidate.arrival_date}`);
    if (candidate.arrival_time) lines.push(`⏰ Время прибытия: ${candidate.arrival_time}`);
  }

  // Ссылки на изображения (каждая на отдельной строке для превью в мессенджерах)
  const docUrls = (formDocs || [])
    .filter(d => d.url)
    .map(d => ({ url: d.url, name: d.name || d.doc_type || 'документ' }));

  if (docUrls.length > 0) {
    lines.push('');
    lines.push('📎 Документы:');
    docUrls.forEach(d => {
      lines.push(d.url);
    });
  }

  return lines.join('\n');
}
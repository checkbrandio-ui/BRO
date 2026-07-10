import type { Candidate, CandidateDocument, SbReportDoc } from './types';

// Список гражданств: РФ + страны СНГ
export const CITIZENSHIPS: string[] = [
  'РФ', 'РБ', 'Казахстан', 'Узбекистан', 'Таджикистан',
  'Киргизия', 'Туркменистан', 'Азербайджан', 'Армения', 'Молдова', 'Украина',
];

// Проверка: является ли гражданство СНГ (всё, что не РФ)
export function isCIS(citizenship: string | undefined): boolean {
  return !!citizenship && citizenship !== 'РФ';
}

interface StatusOption {
  value: string;
  label: string;
  colorClass: string;
}

interface BadgeStyle {
  color: string;
  bg: string;
  border: string;
  icon: string;
}

// Статусы логистики
export const LOGISTICS_STATUS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  none: { label: 'Не отправлено', color: 'text-[#F8FAFC]/30', bg: 'bg-[#F8FAFC]/5', icon: '○' },
  pending_admin: { label: 'На согласовании', color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10', icon: '⏳' },
  pending_candidate: { label: 'Ожидает кандидата', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: '⏳' },
  confirmed: { label: 'Согласовано', color: 'text-green-400', bg: 'bg-green-500/10', icon: '✓' },
};

// Опции для dropdown СБ
export const SB_OPTIONS: StatusOption[] = [
  { value: 'Не проверялся', label: 'Не проверялся', colorClass: 'text-[#F8FAFC]/60' },
  { value: 'На проверке', label: 'На проверке', colorClass: 'text-yellow-400' },
  { value: 'Согласован', label: 'Согласован', colorClass: 'text-green-400' },
  { value: 'Не согласован', label: 'Не согласован', colorClass: 'text-red-400' },
];

// Опции для dropdown Медкомиссии
export const MED_OPTIONS: StatusOption[] = [
  { value: 'Не проверялся', label: 'Не проверялся', colorClass: 'text-[#F8FAFC]/60' },
  { value: 'Прошёл', label: 'Прошёл', colorClass: 'text-green-400' },
  { value: 'Не прошёл', label: 'Не прошёл', colorClass: 'text-red-400' },
];

// Цвета badge-фильтров для статусов СБ
export const SB_BADGE: Record<string, BadgeStyle> = {
  'Не проверялся': { color: 'text-[#F8FAFC]/40', bg: 'bg-[#F8FAFC]/5', border: 'border-[#F8FAFC]/10', icon: '○' },
  'На проверке': { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: '⏳' },
  'Согласован': { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: '✓' },
  'Не согласован': { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '✗' },
};

// Цвета badge-фильтров для медкомиссии
export const MED_BADGE: Record<string, BadgeStyle> = {
  'Не проверялся': { color: 'text-[#F8FAFC]/40', bg: 'bg-[#F8FAFC]/5', border: 'border-[#F8FAFC]/10', icon: '○' },
  'Прошёл': { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: '✓' },
  'Не прошёл': { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '✗' },
};

// Формирование текстового отчёта для СБ (только текст, без ссылок)
export function buildSbReport(
  candidate: Candidate,
  _formDocs: CandidateDocument[],
  candidateFormData: Record<string, unknown> | null
): string {
  const lines: string[] = [];
  const fmt = (v: string | undefined): string => v || '—';

  lines.push(`👤 ФИО: ${fmt(candidate.full_name)}`);
  lines.push(`📅 Дата рождения: ${fmt(candidate.birth_date)}`);

  lines.push('');
  lines.push('🚛 Логистика:');
  lines.push(`📍 Из города: ${fmt(candidate.city)}`);
  lines.push(`📍 Прибывает в: ${fmt(candidate.assembly_point)}`);
  lines.push(`📅 Дата прибытия: ${fmt(candidate.arrival_date)}`);
  lines.push(`Время прибытия: ${candidate.arrival_time || 'не известно'}`);

  lines.push('');
  lines.push('🏥 Здоровье:');
  lines.push(`Хронические заболевания: ${(candidateFormData?.chronic_diseases as string) || 'Нет'}`);
  lines.push(`Инвалидность / ограничения: ${(candidateFormData?.disabilities as string) || 'Нет'}`);

  return lines.join('\n');
}

/**
 * Возвращает документы, которые нужно приложить к отчёту СБ.
 * Каждый документ — { label, url } для отдельной кнопки копирования.
 */
export function getSbReportDocs(
  candidate: Candidate | null,
  formDocs: CandidateDocument[]
): SbReportDoc[] {
  const docs = formDocs || candidate?.documents || [];
  const docMap: Record<string, CandidateDocument> = {};
  docs.forEach((d) => {
    const type = d.doc_type || d.type;
    if (type) docMap[type] = d;
  });

  const baseIds = [
    { id: 'passport_main', label: '📄 Паспорт (фото)' },
    { id: 'passport_reg', label: '📄 Паспорт (прописка)' },
    { id: 'snils', label: '📄 СНИЛС' },
    { id: 'inn', label: '📄 ИНН' },
    { id: 'military', label: '📄 Военный билет' },
  ];

  const cisIds = isCIS(candidate?.citizenship)
    ? [
        { id: 'passport_translation', label: '📄 Перевод паспорта (нотариально)' },
        { id: 'biometrics', label: '📄 Биометрия' },
        { id: 'cis_registration', label: '📄 Регистрация' },
      ]
    : [];

  return [...baseIds, ...cisIds]
    .map((item) => {
      const doc = docMap[item.id];
      return doc?.url ? { label: item.label, url: doc.url } : null;
    })
    .filter((d): d is SbReportDoc => d !== null);
}
/**
 * Утилиты для проверки обязательных документов кандидата.
 */

export const ALL_DOC_TYPES = [
  { id: 'passport_main', label: 'Паспорт (разворот с фото)', required: true },
  { id: 'passport_reg', label: 'Паспорт (страница с пропиской)', required: true },
  { id: 'snils', label: 'СНИЛС', required: true },
  { id: 'inn', label: 'ИНН', required: false },
  { id: 'military', label: 'Военный билет / приписное', required: false },
  { id: 'work_book', label: 'Трудовая книжка (первая страница)', required: false },
  { id: 'driver_license', label: 'Водительское удостоверение', required: false },
  { id: 'diploma', label: 'Диплом об образовании', required: false },
  { id: 'medical', label: 'Медицинская книжка', required: false },
  { id: 'certs', label: 'Допуски / сертификаты', required: false },
];

export const REQUIRED_DOC_TYPES = ALL_DOC_TYPES.filter(d => d.required);

/**
 * Возвращает список обязательных документов, которых нет в загруженных.
 * @param {Array} docs — массив документов (из candidate.documents или form.uploaded_docs)
 * @returns {Array} — отсутствующие обязательные типы
 */
export function getMissingRequiredDocs(docs = []) {
  const uploadedTypes = new Set(
    docs.map(d => d.doc_type || d.type).filter(Boolean)
  );
  return REQUIRED_DOC_TYPES.filter(dt => !uploadedTypes.has(dt.id));
}

/**
 * Проверяет, есть ли у кандидата незагруженные обязательные документы.
 * Учитывает только кандидатов с заполненной анкетой или с хотя бы одним документом.
 * @param {Object} candidate — запись кандидата
 * @returns {boolean}
 */
export function hasMissingRequiredDocs(candidate) {
  if (!candidate) return false;
  // Проверяем полноту только для завершённых анкет
  if (candidate.form_status !== 'completed') return false;
  const docs = candidate.documents || [];
  return getMissingRequiredDocs(docs).length > 0;
}
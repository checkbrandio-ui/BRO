/**
 * Утилиты для проверки обязательных документов кандидата.
 */
import type { CandidateDocument, DocTypeDef, Candidate } from './types';

function isCIS(citizenship: string | undefined): boolean {
  return !!citizenship && citizenship !== 'РФ';
}

export const BASE_DOC_TYPES: DocTypeDef[] = [
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

export const CIS_DOC_TYPES: DocTypeDef[] = [
  { id: 'passport_translation', label: 'Перевод паспорта (нотариально)', required: true },
  { id: 'biometrics', label: 'Биометрия', required: true },
  { id: 'cis_registration', label: 'Регистрация', required: true },
];

// Backwards compatibility
export const ALL_DOC_TYPES = BASE_DOC_TYPES;
export const REQUIRED_DOC_TYPES = BASE_DOC_TYPES.filter((d) => d.required);

export function getDocTypesForCitizenship(citizenship: string | undefined): DocTypeDef[] {
  if (isCIS(citizenship)) {
    return [...BASE_DOC_TYPES, ...CIS_DOC_TYPES];
  }
  return BASE_DOC_TYPES;
}

/** Возвращает список обязательных документов, которых нет в загруженных. */
export function getMissingRequiredDocs(
  docs: CandidateDocument[] = [],
  citizenship?: string
): DocTypeDef[] {
  const uploadedTypes = new Set(
    docs.map((d) => d.doc_type || d.type).filter(Boolean) as string[]
  );
  const requiredTypes = citizenship
    ? getDocTypesForCitizenship(citizenship).filter((d) => d.required)
    : REQUIRED_DOC_TYPES;
  return requiredTypes.filter((dt) => !uploadedTypes.has(dt.id));
}

export function hasMissingRequiredDocs(candidate: Candidate | null): boolean {
  if (!candidate) return false;
  if (candidate.form_status !== 'completed') return false;
  const docs = candidate.documents || [];
  return getMissingRequiredDocs(docs, candidate.citizenship).length > 0;
}
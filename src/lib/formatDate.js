/**
 * Форматирует дату из ISO/DB-формата (YYYY-MM-DD или ISO 8601) в DD.MM.YYYY.
 * Используется только для отображения — в БД хранится ISO.
 * @param {string|null|undefined} dateStr
 * @param {object} opts - { withTime: boolean }
 * @returns {string}
 */
export function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '';
  const { withTime = false } = opts;

  // Если это полная ISO-строка (с временем)
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    if (withTime) {
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
    }
    return `${dd}.${mm}.${yyyy}`;
  }

  // Простой формат YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  return dateStr;
}
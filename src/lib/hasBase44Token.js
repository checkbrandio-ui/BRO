/**
 * ARCHITECTURAL CONTRACT — Критический хелпер
 * 
 * Используется ВЕЗДЕ вместо base44.auth.me() и isAuthenticated()
 * когда нужно определить, авторизован ли админ.
 * 
 * Проверяет НАЛИЧИЕ токена в localStorage — БЕЗ сетевого запроса.
 * base44.auth.me() вызывает API и возвращает 401 на публичных страницах.
 * Этот хелпер никогда не вызовет 401.
 */
export function hasAdminToken() {
  const token = localStorage.getItem('base44_access_token');
  return !!token && token.length > 10;
}

/**
 * Проверяет сессию агентства в sessionStorage.
 * Агентства НЕ используют base44 auth — только agency_session.
 */
export function hasAgencySession() {
  try {
    const raw = sessionStorage.getItem('agency_session');
    if (!raw) return false;
    const session = JSON.parse(raw);
    return !!(session && session.id);
  } catch {
    return false;
  }
}

/**
 * Возвращает agency_id из sessionStorage.
 */
export function getAgencyId() {
  try {
    const raw = sessionStorage.getItem('agency_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.id || null;
  } catch {
    return null;
  }
}

/**
 * Возвращает agency_name из sessionStorage.
 */
export function getAgencyName() {
  try {
    const raw = sessionStorage.getItem('agency_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.name || null;
  } catch {
    return null;
  }
}
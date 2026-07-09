/**
 * Управление сессией CRM-администратора.
 * Вход по секретному коду — не зависит от стандартной авторизации Base44.
 * Сессия хранится в localStorage (переживает перезапуск браузера).
 */

const CRM_SESSION_KEY = 'crm_admin_session';

/**
 * Получить текущего CRM-админа из сессии.
 * @returns {{ id: string, full_name: string, role: string } | null}
 */
export function getCrmAdmin() {
  try {
    const raw = localStorage.getItem(CRM_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Сохранить сессию CRM-админа (без access_code — код не храним в браузере).
 */
export function setCrmAdmin(admin) {
  localStorage.setItem(CRM_SESSION_KEY, JSON.stringify({
    id: admin.id,
    full_name: admin.full_name,
    role: admin.role,
  }));
}

/**
 * Очистить сессию (выход).
 */
export function clearCrmSession() {
  localStorage.removeItem(CRM_SESSION_KEY);
}

/**
 * Авторизован ли CRM-админ.
 */
export function isCrmAuthenticated() {
  return !!getCrmAdmin();
}

/**
 * Текущий админ — супер-админ?
 */
export function isSuperAdmin() {
  const admin = getCrmAdmin();
  return admin?.role === 'super_admin';
}

/**
 * Может ли текущущий админ окончательно удалять записи.
 * Только super_admin.
 */
export function canPermanentDelete() {
  return isSuperAdmin();
}

/**
 * Получить объект «актёра» для логирования действий.
 * Заменяет base44.auth.me() в админ-страницах.
 * @returns {{ name: string, role: string }}
 */
export function getCurrentActor() {
  const admin = getCrmAdmin();
  if (admin) {
    return {
      name: admin.full_name,
      role: admin.role === 'super_admin' ? 'admin' : 'manager',
    };
  }
  return { name: 'Администратор', role: 'admin' };
}

/**
 * Сгенерировать случайный код доступа.
 * Формат: CRM-XXXX-XXXX-XXXX (без неоднозначных символов I, O, 0, 1).
 */
export function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) seg += chars[Math.floor(Math.random() * chars.length)];
    segments.push(seg);
  }
  return 'CRM-' + segments.join('-');
}
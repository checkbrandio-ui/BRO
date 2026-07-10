/**
 * Управление сессией CRM-администратора.
 * Вход по секретному коду — не зависит от стандартной авторизации Base44.
 * Сессия хранится в sessionStorage (удаляется при закрытии вкладки).
 */
import type { CrmAdmin, Actor } from './types';

const CRM_SESSION_KEY = 'crm_admin_session';

/** Получить текущего CRM-админа из сессии. */
export function getCrmAdmin(): CrmAdmin | null {
  try {
    const raw = sessionStorage.getItem(CRM_SESSION_KEY);
    return raw ? (JSON.parse(raw) as CrmAdmin) : null;
  } catch {
    return null;
  }
}

/** Сохранить сессию CRM-админа (без access_code — код не храним в браузере). */
export function setCrmAdmin(admin: CrmAdmin): void {
  sessionStorage.setItem(
    CRM_SESSION_KEY,
    JSON.stringify({ id: admin.id, full_name: admin.full_name, role: admin.role })
  );
}

/** Очистить сессию (выход). */
export function clearCrmSession(): void {
  sessionStorage.removeItem(CRM_SESSION_KEY);
}

/** Авторизован ли CRM-админ. */
export function isCrmAuthenticated(): boolean {
  return !!getCrmAdmin();
}

/** Текущий админ — супер-админ? */
export function isSuperAdmin(): boolean {
  return getCrmAdmin()?.role === 'super_admin';
}

/** Может ли текущий админ окончательно удалять записи. Только super_admin. */
export function canPermanentDelete(): boolean {
  return isSuperAdmin();
}

/**
 * Получить объект «актёра» для логирования действий.
 * Заменяет base44.auth.me() в админ-страницах.
 */
export function getCurrentActor(): Actor {
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
export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments: string[] = [];
  for (let s = 0; s < 3; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) seg += chars[Math.floor(Math.random() * chars.length)];
    segments.push(seg);
  }
  return 'CRM-' + segments.join('-');
}
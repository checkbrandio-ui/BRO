import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCrmAdmin, setCrmAdmin, clearCrmSession, isCrmAuthenticated, isSuperAdmin, canPermanentDelete, getCurrentActor } from '../crmSession.js';

const SESSION_KEY = 'crm_admin_session';

describe('CRM Session Storage Migration', () => {
  const mockAdmin = {
    id: 'admin-123',
    full_name: 'Иван Иванов',
    role: 'super_admin',
  };

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  // ✅ ТЕСТ 1: Сессия сохраняется в sessionStorage, а не в localStorage
  it('сохраняет CRM-сессию в sessionStorage (не localStorage)', () => {
    setCrmAdmin(mockAdmin);

    expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  // ✅ ТЕСТ 2: Сохраняемый объект содержит id, full_name, role (без access_code)
  it('сохраняет только id, full_name и role (без access_code)', () => {
    setCrmAdmin({ ...mockAdmin, access_code: 'CRM-SECRET-CODE' });

    const raw = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    expect(raw.id).toBe(mockAdmin.id);
    expect(raw.full_name).toBe(mockAdmin.full_name);
    expect(raw.role).toBe(mockAdmin.role);
    expect(raw.access_code).toBeUndefined();
  });

  // ✅ ТЕСТ 3: getCrmAdmin возвращает объект админа
  it('getCrmAdmin возвращает сохранённый объект админа', () => {
    setCrmAdmin(mockAdmin);

    const admin = getCrmAdmin();
    expect(admin).toEqual({
      id: 'admin-123',
      full_name: 'Иван Иванов',
      role: 'super_admin',
    });
  });

  // ✅ ТЕСТ 4: Возврат null при отсутствии сессии
  it('getCrmAdmin возвращает null, если сессия не установлена', () => {
    expect(getCrmAdmin()).toBeNull();
  });

  // ✅ ТЕСТ 5: clearCrmSession удаляет сессию из sessionStorage
  it('clearCrmSession удаляет сессию из sessionStorage', () => {
    setCrmAdmin(mockAdmin);
    expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();

    clearCrmSession();

    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  // ✅ ТЕСТ 6: clearCrmSession НЕ трогает localStorage (другие ключи не затрагиваются)
  it('clearCrmSession не удаляет другие ключи из localStorage', () => {
    localStorage.setItem('crm-badge-pos', JSON.stringify({ x: 100, y: 200 }));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(mockAdmin));

    clearCrmSession();

    expect(localStorage.getItem('crm-badge-pos')).toBe(JSON.stringify({ x: 100, y: 200 }));
  });

  // ✅ ТЕСТ 7: Перезапись сессии при повторном setCrmAdmin
  it('корректно перезаписывает сессию при повторном вызове setCrmAdmin', () => {
    setCrmAdmin(mockAdmin);
    expect(getCrmAdmin().full_name).toBe('Иван Иванов');

    setCrmAdmin({ id: 'admin-456', full_name: 'Пётр Петров', role: 'manager' });
    expect(getCrmAdmin().full_name).toBe('Пётр Петров');
    expect(getCrmAdmin().role).toBe('manager');
  });

  // ✅ ТЕСТ 8: isCrmAuthenticated
  it('isCrmAuthenticated возвращает true при наличии сессии, false при отсутствии', () => {
    expect(isCrmAuthenticated()).toBe(false);

    setCrmAdmin(mockAdmin);
    expect(isCrmAuthenticated()).toBe(true);

    clearCrmSession();
    expect(isCrmAuthenticated()).toBe(false);
  });

  // ✅ ТЕСТ 9: isSuperAdmin
  it('isSuperAdmin возвращает true только для role === "super_admin"', () => {
    setCrmAdmin({ id: '1', full_name: 'Test', role: 'manager' });
    expect(isSuperAdmin()).toBe(false);

    setCrmAdmin({ id: '2', full_name: 'Test', role: 'super_admin' });
    expect(isSuperAdmin()).toBe(true);
  });

  // ✅ ТЕСТ 10: canPermanentDelete — только для super_admin
  it('canPermanentDelete возвращает true только для super_admin', () => {
    setCrmAdmin({ id: '1', full_name: 'Test', role: 'manager' });
    expect(canPermanentDelete()).toBe(false);

    setCrmAdmin({ id: '2', full_name: 'Test', role: 'super_admin' });
    expect(canPermanentDelete()).toBe(true);
  });

  // ✅ ТЕСТ 11: getCurrentActor — возвращает объект { name, role } для логирования
  it('getCurrentActor возвращает { name, role } для логирования', () => {
    setCrmAdmin({ id: '1', full_name: 'Иван', role: 'super_admin' });
    const actor = getCurrentActor();
    expect(actor).toEqual({ name: 'Иван', role: 'admin' });

    setCrmAdmin({ id: '2', full_name: 'Пётр', role: 'manager' });
    const actor2 = getCurrentActor();
    expect(actor2).toEqual({ name: 'Пётр', role: 'manager' });
  });

  // ✅ ТЕСТ 12: getCurrentActor — fallback при отсутствии сессии
  it('getCurrentActor возвращает fallback при отсутствии сессии', () => {
    const actor = getCurrentActor();
    expect(actor).toEqual({ name: 'Администратор', role: 'admin' });
  });

  // ✅ ТЕСТ 13: Поведение sessionStorage — изоляция (документирующий тест)
  it('sessionStorage изолирован от localStorage', () => {
    setCrmAdmin(mockAdmin);

    // sessionStorage содержит сессию
    expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();
    // localStorage — нет
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  // ✅ ТЕСТ 14: Обработка повреждённого JSON в sessionStorage
  it('getCrmAdmin возвращает null при повреждённом JSON', () => {
    sessionStorage.setItem(SESSION_KEY, '{invalid json}');
    expect(getCrmAdmin()).toBeNull();
  });
});
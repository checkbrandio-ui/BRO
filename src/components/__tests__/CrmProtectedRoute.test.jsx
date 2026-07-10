import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CrmProtectedRoute, { CrmSuperAdminRoute } from '../CrmProtectedRoute.jsx';
import { setCrmAdmin, clearCrmSession } from '@/lib/crmSession';

const SESSION_KEY = 'crm_admin_session';

const ProtectedContent = () => <div>Protected Content</div>;
const SuperAdminContent = () => <div>Super Admin Content</div>;

function renderWithRouter(initialPath = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/crm-login" element={<div data-testid="login-page">Login Page</div>} />
        <Route path="/admin/candidates" element={<div data-testid="candidates-page">Candidates</div>} />
        <Route element={<CrmProtectedRoute />}>
          <Route path="/protected" element={<ProtectedContent />} />
        </Route>
        <Route element={<CrmSuperAdminRoute />}>
          <Route path="/super-only" element={<SuperAdminContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('CrmProtectedRoute с sessionStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  // ✅ ТЕСТ 1: Редирект при отсутствии сессии
  it('редиректит на /crm-login, если нет сессии в sessionStorage', () => {
    clearCrmSession();
    renderWithRouter('/protected');

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  // ✅ ТЕСТ 2: Доступ при наличии валидной сессии
  it('показывает защищённый контент, если сессия присутствует в sessionStorage', () => {
    setCrmAdmin({ id: '1', full_name: 'Админ', role: 'manager' });
    renderWithRouter('/protected');

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  // ✅ ТЕСТ 3: Редирект manager при попытке доступа к super_admin-маршруту
  it('редиректит manager на /admin/candidates при доступе к super_admin-маршруту', () => {
    setCrmAdmin({ id: '1', full_name: 'Менеджер', role: 'manager' });
    renderWithRouter('/super-only');

    expect(screen.getByTestId('candidates-page')).toBeInTheDocument();
    expect(screen.queryByText('Super Admin Content')).not.toBeInTheDocument();
  });

  // ✅ ТЕСТ 4: Доступ super_admin к super_admin-маршруту
  it('показывает super_admin-контент для super_admin', () => {
    setCrmAdmin({ id: '1', full_name: 'Супер', role: 'super_admin' });
    renderWithRouter('/super-only');

    expect(screen.getByText('Super Admin Content')).toBeInTheDocument();
  });

  // ✅ ТЕСТ 5: Сессия не читается из localStorage
  it('не предоставляет доступ, если сессия только в localStorage (не sessionStorage)', () => {
    // Помещаем сессию в localStorage (старое поведение)
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: '1', full_name: 'Админ', role: 'manager' }));
    // sessionStorage пуст
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();

    renderWithRouter('/protected');

    // Должен редиректить — сессии в sessionStorage нет
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
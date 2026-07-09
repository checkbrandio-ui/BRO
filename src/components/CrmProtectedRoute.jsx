import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isCrmAuthenticated, isSuperAdmin } from '@/lib/crmSession';

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#05070A]">
    <div className="w-8 h-8 border-4 border-[#7B3FBF]/30 border-t-[#7B3FBF] rounded-full animate-spin" />
  </div>
);

/**
 * Защита маршрутов CRM — требуется активная сессия CRM-админа.
 * Не зависит от стандартной авторизации Base44.
 */
export default function CrmProtectedRoute() {
  const location = useLocation();

  if (!isCrmAuthenticated()) {
    return <Navigate to={`/crm-login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
}

/**
 * Защита только для super_admin (управление админами и т.д.)
 */
export function CrmSuperAdminRoute() {
  const location = useLocation();

  if (!isCrmAuthenticated()) {
    return <Navigate to={`/crm-login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!isSuperAdmin()) {
    return <Navigate to="/admin/candidates" replace />;
  }

  return <Outlet />;
}
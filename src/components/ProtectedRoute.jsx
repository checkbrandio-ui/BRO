import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#05070A]">
    <div className="w-8 h-8 border-4 border-[#7B3FBF]/30 border-t-[#7B3FBF] rounded-full animate-spin" />
  </div>
);

const NoAccess = () => (
  <div className="min-h-screen bg-[#05070A] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[rgba(123,63,191,0.15)] border border-[rgba(123,63,191,0.3)] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7B3FBF" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <h1 className="text-2xl font-bold text-[#F8FAFC] mb-2">Доступ закрыт</h1>
      <p className="text-[#F8FAFC]/50 text-sm mb-6">Авторизуйтесь через ваше кадровое агентство</p>
      <a href="/agency-login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7B3FBF] text-white font-bold hover:bg-[#8B4FCF] transition-all">
        Войти по коду агентства
      </a>
    </div>
  </div>
);

// Защита для любого авторизованного пользователя
export default function ProtectedRoute() {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return <Spinner />;

  if (!isAuthenticated) {
    return <NoAccess />;
  }

  return <Outlet />;
}

// Защита только для admin
export function AdminRoute() {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();

  if (isLoadingAuth) return <Spinner />;

  if (!isAuthenticated) {
    return <NoAccess />;
  }

  if (user?.role !== 'admin') {
    return <NoAccess />;
  }

  return <Outlet />;
}
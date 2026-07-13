import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { isCrmAuthenticated } from '@/lib/crmSession';

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!isCrmAuthenticated()) return;
    try {
      const items = await apiClient.get('/api/notifications?is_read=false&limit=50');
      if (mountedRef.current) {
        setUnread(Array.isArray(items) ? items.length : 0);
      }
    } catch (_) {
      // 401 или сетевая ошибка — молча игнорируем, не блокируем UI
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!isCrmAuthenticated()) return;
    setVisible(true);

    // Небольшая задержка — даём токену записаться в localStorage после логина
    const initialTimer = setTimeout(() => {
      load();
    }, 500);

    const interval = setInterval(load, 30000);

    return () => {
      mountedRef.current = false;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [load]);

  if (!visible) return null;

  return (
    <Link
      to="/admin/notifications"
      title="Уведомления"
      className="fixed bottom-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-lg border border-[rgba(123,63,191,0.2)] text-[#F8FAFC]/50 hover:text-[#7B3FBF] hover:border-[#7B3FBF]/40 transition-all bg-[#05070A]"
    >
      <div className="relative flex items-center justify-center w-full h-full">
        <Bell size={15} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#C9A84C] text-[#05070A] text-[10px] font-black">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </div>
    </Link>
  );
}

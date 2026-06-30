import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';

export default function AgencyNotificationBell({ agencyId }) {
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    if (!agencyId) return;
    try {
      const items = await base44.entities.Notification.filter(
        { is_read: false, agency_id: agencyId },
        '-created_date',
        50
      );
      setUnread(items.length);
    } catch (_) {}
  }, [agencyId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    const unsubscribe = base44.entities.Notification.subscribe(() => load());
    return () => {
      clearInterval(interval);
      unsubscribe?.();
    };
  }, [load]);

  return (
    <Link
      to="/admin/notifications"
      title="Уведомления"
      className="p-2 rounded-lg border border-[rgba(123,63,191,0.2)] text-[#F8FAFC]/50 hover:text-[#7B3FBF] hover:border-[#7B3FBF]/40 transition-all relative flex items-center justify-center w-10 h-10"
    >
      <Bell size={14} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#C9A84C] text-[#05070A] text-[10px] font-black">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
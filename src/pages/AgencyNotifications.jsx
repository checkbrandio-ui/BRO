import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/base44Client';
import { X, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AgencyNotifications() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem('agency_session')); } catch { return null; }
  })();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.id) { navigate('/agency-login', { replace: true }); return; }
    load();
  }, []);

  const load = async () => {
    if (!session?.id) return;
    setLoading(true);
    try {
      const items = await apiClient.get(`/api/notifications?agency_id=${session.id}&limit=100`);
      setNotifications(Array.isArray(items) ? items : []);
    } catch (e) {
      toast({ title: 'Ошибка загрузки уведомлений', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.patch(`/api/notifications/${id}`, { is_read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      toast({ title: 'Ошибка', description: e.message, variant: 'destructive' });
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    try {
      await Promise.all(unread.map(n => apiClient.patch(`/api/notifications/${n.id}`, { is_read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      toast({ title: 'Ошибка', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      toast({ title: 'Ошибка удаления', description: e.message, variant: 'destructive' });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F8FAFC]">
      <div className="border-b border-[rgba(123,63,191,0.15)] bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold">Уведомления — {session?.name}</h1>
          <div className="flex items-center gap-2">
            <button onClick={load} title="Обновить"
              className="p-2 rounded-lg border border-[rgba(123,63,191,0.2)] text-[#F8FAFC]/50 hover:text-[#7B3FBF] transition-all">
              <RefreshCw size={14} />
            </button>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead}
                className="text-xs px-4 py-2 rounded border border-[#7B3FBF]/30 text-[#7B3FBF] hover:bg-[#7B3FBF]/10 transition-all">
                Отметить всё как прочитано ({unreadCount})
              </button>
            )}
            <button onClick={() => navigate('/agency/workspace')}
              className="p-2 rounded-lg border border-[rgba(255,255,255,0.1)] text-[#F8FAFC]/50 hover:text-[#F8FAFC] transition-all">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#7B3FBF]/30 border-t-[#7B3FBF] rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-[#F8FAFC]/30">
            <p>Уведомлений нет</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id}
                className={`p-4 rounded-lg border transition-all ${n.is_read ? 'bg-[rgba(255,255,255,0.02)] border-[rgba(123,63,191,0.08)] opacity-60' : 'bg-[rgba(123,63,191,0.08)] border-[rgba(123,63,191,0.25)]'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#C9A84C] flex-shrink-0" />}
                      <p className="font-bold text-[#F8FAFC] text-sm">{n.candidate_name}</p>
                      <span className="text-xs text-[#F8FAFC]/40 ml-auto flex-shrink-0">{n.category}</span>
                    </div>
                    <p className="text-sm text-[#F8FAFC]/80 leading-relaxed">{n.message}</p>
                    {n.created_date && (
                      <p className="text-xs text-[#F8FAFC]/30 mt-2">
                        {new Date(n.created_date).toLocaleString('ru-RU')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.is_read && (
                      <button onClick={() => handleMarkAsRead(n.id)}
                        className="p-1.5 rounded hover:bg-green-500/20 text-[#F8FAFC]/40 hover:text-green-400 transition-all"
                        title="Отметить как прочитано">
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(n.id)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-[#F8FAFC]/40 hover:text-red-400 transition-all"
                      title="Удалить">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

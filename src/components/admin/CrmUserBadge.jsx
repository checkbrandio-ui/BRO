import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCrmAdmin, clearCrmSession } from '@/lib/crmSession';
import { LogOut, ShieldCheck, UserCog, ChevronUp } from 'lucide-react';

/**
 * Плавающий бейдж текущего CRM-админа.
 * Показывает ФИО, роль и кнопку выхода.
 * Виден только когда есть активная CRM-сессия.
 */
export default function CrmUserBadge() {
  const admin = getCrmAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!admin) return null;

  const handleLogout = () => {
    clearCrmSession();
    navigate('/crm-login');
  };

  const isSuper = admin.role === 'super_admin';

  return (
    <div className="fixed top-4 right-4 z-50">
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-60 bg-[#0D1B3E] border border-[rgba(123,63,191,0.3)] rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="p-3 border-b border-[rgba(123,63,191,0.15)]">
              <div className="text-sm font-bold text-[#F8FAFC] truncate">{admin.full_name}</div>
              <div className="text-xs flex items-center gap-1 mt-0.5">
                {isSuper
                  ? <ShieldCheck size={11} className="text-[#C9A84C]" />
                  : <UserCog size={11} className="text-[#7B3FBF]" />}
                <span className={isSuper ? 'text-[#C9A84C]' : 'text-[#7B3FBF]'}>
                  {isSuper ? 'Супер-администратор' : 'Менеджер CRM'}
                </span>
              </div>
            </div>
            {isSuper && (
              <button
                onClick={() => { navigate('/admin/crm-admins'); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#F8FAFC]/60 hover:bg-[rgba(123,63,191,0.1)] transition-colors">
                <UserCog size={13} /> Управление админами
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors border-t border-[rgba(123,63,191,0.1)]">
              <LogOut size={13} /> Выйти из CRM
            </button>
          </div>
        </>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0D1B3E] border shadow-lg hover:shadow-xl transition-all ${
          isSuper ? 'border-[rgba(201,168,76,0.4)]' : 'border-[rgba(123,63,191,0.3)]'
        }`}>
        {isSuper
          ? <ShieldCheck size={15} className="text-[#C9A84C]" />
          : <UserCog size={15} className="text-[#7B3FBF]" />}
        <span className="text-xs font-medium text-[#F8FAFC] max-w-[120px] truncate">{admin.full_name}</span>
        <ChevronUp size={13} className={`text-[#F8FAFC]/30 transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>
  );
}
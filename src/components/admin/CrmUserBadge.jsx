import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCrmAdmin, clearCrmSession } from '@/lib/crmSession';
import { LogOut, ShieldCheck, UserCog, ChevronUp, GripHorizontal } from 'lucide-react';

const STORAGE_KEY = 'crm-badge-pos';
const DRAG_THRESHOLD = 5;

/**
 * Плавающий перетаскиваемый бейдж текущего CRM-админа.
 * Показывает ФИО, роль и кнопку выхода.
 * Позиция сохраняется в localStorage.
 * Виден только когда есть активная CRM-сессия.
 */
export default function CrmUserBadge() {
  const admin = getCrmAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p.x === 'number' && typeof p.y === 'number') return p;
      }
    } catch {}
    return null; // null = позиция по умолчанию (top-right)
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, startY: 0, posX: 0, posY: 0, moved: false });
  const draggingRef = useRef(false);
  const elRef = useRef(null);

  if (!admin) return null;

  const handleLogout = () => {
    clearCrmSession();
    navigate('/crm-login');
  };

  const isSuper = admin.role === 'super_admin';

  const clamp = (x, y) => {
    const el = elRef.current;
    const w = el?.offsetWidth || 200;
    const h = el?.offsetHeight || 50;
    return {
      x: Math.max(8, Math.min(x, window.innerWidth - w - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - h - 8)),
    };
  };

  const onPointerDown = (e) => {
    // Клик по кнопке меню — не перетаскивание
    if (e.target.closest('[data-menu-toggle]') || e.button !== 0) return;
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Если позиция не задана — берём текущую (top-right по умолчанию)
    const currentX = pos ?? (window.innerWidth - rect.width - 16);
    const currentY = pos ?? 16;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentX,
      posY: currentY,
      moved: false,
    };
    draggingRef.current = true;
    el.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      dragState.current.moved = true;
      setIsDragging(true);
    }
    if (dragState.current.moved) {
      setPos(clamp(dragState.current.posX + dx, dragState.current.posY + dy));
    }
  };

  const onPointerUp = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const wasDragged = dragState.current.moved;
    setIsDragging(false);
    if (wasDragged && pos) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch {}
      // Блокируем открытие меню после перетаскивания
      e.stopPropagation();
    }
  };

  // Позиция: если pos задан — absolute, иначе top-right по умолчанию
  const style = pos
    ? { left: `${pos.x}px`, top: `${pos.y}px` }
    : { top: '1rem', right: '1rem' };

  return (
    <div
      ref={elRef}
      className={`fixed z-50 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
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
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0D1B3E] border shadow-lg hover:shadow-xl transition-all group">
        {/* Drag handle */}
        <GripHorizontal size={12} className="text-[#F8FAFC]/20 group-hover:text-[#F8FAFC]/40 transition-colors flex-shrink-0" />
        <button
          data-menu-toggle
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-2 flex-1 cursor-pointer ${isDragging ? 'pointer-events-none' : ''}`}
        >
          {isSuper
            ? <ShieldCheck size={15} className="text-[#C9A84C] flex-shrink-0" />
            : <UserCog size={15} className="text-[#7B3FBF] flex-shrink-0" />}
          <span className="text-xs font-medium text-[#F8FAFC] max-w-[120px] truncate">{admin.full_name}</span>
          <ChevronUp size={13} className={`text-[#F8FAFC]/30 transition-transform ${open ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </div>
  );
}
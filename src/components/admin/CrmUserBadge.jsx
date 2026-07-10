import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCrmAdmin, clearCrmSession } from '@/lib/crmSession';
import { LogOut, ShieldCheck, UserCog, ChevronUp, GripHorizontal } from 'lucide-react';

const STORAGE_KEY = 'crm-badge-pos';
const DRAG_THRESHOLD = 5;

/**
 * Плавающий перетаскиваемый бейдж текущего CRM-админа.
 * Перетаскивание работает через window-слушатели и прямое
 * обновление DOM — ноль ре-рендеров во время drag.
 */
export default function CrmUserBadge() {
  const admin = getCrmAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const elRef = useRef(null);
  const dragState = useRef({ active: false, startX: 0, startY: 0, posX: 0, posY: 0, moved: false });

  // Загружаем сохранённую позицию один раз
  const savedPos = useRef(null);
  if (savedPos.current === null) {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (typeof p.x === 'number' && typeof p.y === 'number') savedPos.current = p;
      }
    } catch {}
    if (savedPos.current === null) savedPos.current = false; // false = default position
  }

  if (!admin) return null;

  const isSuper = admin.role === 'super_admin';

  const handleLogout = () => {
    clearCrmSession();
    navigate('/crm-login');
  };

  const onDragStart = (e) => {
    if (e.target.closest('[data-menu-toggle]') || e.button !== 0) return;
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      posX: rect.left,
      posY: rect.top,
      moved: false,
    };
    el.style.transition = 'none';
    el.style.cursor = 'grabbing';
    e.preventDefault();

    const onMove = (ev) => {
      if (!dragState.current.active) return;
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      if (!dragState.current.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        dragState.current.moved = true;
      }
      if (dragState.current.moved) {
        const el2 = elRef.current;
        if (!el2) return;
        let nx = dragState.current.posX + dx;
        let ny = dragState.current.posY + dy;
        const w = el2.offsetWidth;
        const h = el2.offsetHeight;
        nx = Math.max(8, Math.min(nx, window.innerWidth - w - 8));
        ny = Math.max(8, Math.min(ny, window.innerHeight - h - 8));
        // Прямое обновление DOM — без React state, без ре-рендеров
        el2.style.left = nx + 'px';
        el2.style.top = ny + 'px';
        el2.style.right = 'auto';
      }
    };

    const onUp = () => {
      dragState.current.active = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const el2 = elRef.current;
      if (el2) {
        el2.style.transition = '';
        el2.style.cursor = '';
      }
      if (dragState.current.moved && el2) {
        // Сохраняем финальную позицию
        const rect = el2.getBoundingClientRect();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: Math.round(rect.left), y: Math.round(rect.top) }));
        } catch {}
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const style = savedPos.current
    ? { left: `${savedPos.current.x}px`, top: `${savedPos.current.y}px` }
    : { top: '1rem', right: '1rem' };

  return (
    <div
      ref={elRef}
      className="fixed z-40 select-none"
      style={style}
      onMouseDown={onDragStart}
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
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0D1B3E] border shadow-lg hover:shadow-xl transition-shadow group">
        <GripHorizontal size={12} className="text-[#F8FAFC]/20 group-hover:text-[#F8FAFC]/40 transition-colors flex-shrink-0 cursor-grab active:cursor-grabbing" />
        <button
          data-menu-toggle
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 flex-1 cursor-pointer"
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
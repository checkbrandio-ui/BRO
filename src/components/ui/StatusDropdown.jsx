import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Кастомный dropdown выбора статуса.
 * Дизайн: полупрозрачная стеклянная панель с blur, тёмный текст, галочка на выбранном.
 */
export default function StatusDropdown({
  value,
  onChange,
  options,
  placeholder = 'Выбрать...',
  icon: Icon,
  compact = false,
  className = '',
  allowEmpty = false,
  emptyLabel = 'Все',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find(o => o.value === value);
  const allOptions = allowEmpty ? [{ value: '', label: emptyLabel }, ...options] : options;
  const padClass = compact ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center justify-between gap-2 w-full ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'} bg-[rgba(255,255,255,0.04)] border border-[rgba(123,63,191,0.2)] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#7B3FBF] transition-all cursor-pointer hover:border-[rgba(123,63,191,0.4)]`}
      >
        <span className="flex items-center gap-1.5 truncate min-w-0">
          {Icon && <Icon size={compact ? 12 : 13} className="opacity-50 flex-shrink-0" />}
          <span className={`truncate ${selected ? (selected.colorClass || '') : 'text-[#F8FAFC]/40'}`}>
            {selected?.label || placeholder}
          </span>
        </span>
        <ChevronDown size={compact ? 12 : 13} className={`opacity-40 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-[100] shadow-2xl"
          style={{
            background: 'rgba(225,225,225,0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {allOptions.map((opt, i) => {
            const isSelected = opt.value === value;
            const isLast = i === allOptions.length - 1;
            const divider = isLast ? '' : 'border-b border-black/5';
            const stateClass = isSelected
              ? 'text-[#111] font-semibold bg-black/5'
              : 'text-[#333] hover:text-[#000] hover:bg-[#7B3FBF]/15';
            return (
              <button
                key={opt.value || 'empty'}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex items-center gap-2 w-full ${padClass} text-left transition-colors ${divider} ${stateClass}`}
              >
                <span className="w-4 flex-shrink-0">
                  {isSelected && <Check size={compact ? 12 : 13} className="text-[#7B3FBF]" />}
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
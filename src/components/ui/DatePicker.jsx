import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Простой выбор даты: нативный input type="date" + иконка.
 * value: ISO строка "yyyy-MM-dd"
 * onChange: callback(isoString)
 */
export default function DatePicker({ value, onChange, className, placeholder = 'Выберите дату', readOnly = false, disabled = false }) {
  return (
    <div className="relative w-full">
      <input
        type="date"
        value={value || ''}
        onChange={e => onChange(e.target.value || '')}
        disabled={readOnly || disabled}
        className={cn(
          'w-full px-3 py-2.5 text-sm rounded-lg border bg-[rgba(255,255,255,0.04)] border-[rgba(123,63,191,0.2)] text-[#F8FAFC] focus:outline-none focus:border-[#7B3FBF] transition-all disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
      />
      <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F8FAFC]/30 pointer-events-none" />
    </div>
  );
}
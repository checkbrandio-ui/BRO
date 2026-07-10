import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Красивый выбор даты с календарём.
 * value: ISO строка "yyyy-MM-dd"
 * onChange: callback(isoString)
 */
export default function DatePicker({ value, onChange, className, placeholder = 'Выберите дату', readOnly = false, disabled = false }) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value + 'T00:00:00') : undefined;

  const handleSelect = (d) => {
    if (!d) return;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  };

  const formatted = value ? new Date(value + 'T00:00:00').toLocaleDateString('ru-RU') : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={readOnly || disabled}
          className={cn(
            'flex items-center justify-between gap-2 w-full px-3 py-2.5 text-sm rounded-lg border bg-[rgba(255,255,255,0.04)] border-[rgba(123,63,191,0.2)] text-[#F8FAFC] focus:outline-none focus:border-[#7B3FBF] transition-all cursor-pointer hover:border-[rgba(123,63,191,0.4)] disabled:cursor-not-allowed disabled:opacity-60',
            className
          )}
        >
          <span className={formatted ? '' : 'text-[#F8FAFC]/30'}>{formatted || placeholder}</span>
          <CalendarIcon size={14} className="opacity-40 flex-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-[#0D1B3E] border-[rgba(123,63,191,0.25)]" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          locale={ru}
          initialFocus
          classNames={{
            months: 'flex flex-col space-y-4',
            month: 'space-y-4',
            caption: 'flex justify-center pt-1 relative items-center',
            caption_label: 'text-sm font-medium text-[#F8FAFC]',
            nav: 'space-x-1 flex items-center',
            nav_button: 'inline-flex items-center justify-center h-7 w-7 bg-transparent border border-[rgba(123,63,191,0.2)] rounded-md opacity-70 hover:opacity-100 hover:bg-[#7B3FBF]/20 text-[#F8FAFC]',
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse space-y-1',
            head_row: 'flex',
            head_cell: 'text-[#F8FAFC]/40 rounded-md w-9 font-normal text-[0.8rem] text-center',
            row: 'flex w-full mt-2',
            cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-[#7B3FBF]/20 [&:has([aria-selected])]:rounded-md',
            day: 'inline-flex items-center justify-center h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-[#F8FAFC] rounded-md hover:bg-[#7B3FBF]/15 hover:text-white cursor-pointer',
            day_selected: 'bg-[#7B3FBF] text-white hover:bg-[#7B3FBF] hover:text-white focus:bg-[#7B3FBF] focus:text-white',
            day_today: 'bg-[#7B3FBF]/15 text-[#C9A84C] font-bold',
            day_outside: 'text-[#F8FAFC]/20 aria-selected:bg-[#7B3FBF]/10 aria-selected:text-[#F8FAFC]/40',
            day_disabled: 'text-[#F8FAFC]/20 opacity-30',
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
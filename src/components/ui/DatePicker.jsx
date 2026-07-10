import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/** value(ISO "yyyy-MM-dd") → "dd.mm.yyyy" */
function formatDisplay(value) {
  if (!value) return '';
  const d = new Date(value + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

/** Текст пользователя → ISO "yyyy-MM-dd" или null если не распознано */
function parseManual(text) {
  if (!text) return '';
  const t = text.trim();
  // dd.mm.yyyy
  let m = t.match(/^(\d{1,2})[.](\d{1,2})[.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  // dd.mm.yy
  m = t.match(/^(\d{1,2})[.](\d{1,2})[.](\d{2})$/);
  if (m) {
    const yy = parseInt(m[3]);
    return `${yy > 50 ? '19' : '20'}${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }
  // yyyy-mm-dd
  m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  // ddMMyyyy (8 цифр без разделителей)
  m = t.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

export default function DatePicker({ value, onChange, className, placeholder = 'дд.мм.гггг', readOnly = false, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(formatDisplay(value));

  // Синхронизируем локальный текст при изменении внешнего value (календарь, сброс и т.д.)
  useEffect(() => {
    setText(formatDisplay(value));
  }, [value]);

  const date = value ? new Date(value + 'T00:00:00') : undefined;

  const handleCalendarSelect = (d) => {
    if (!d) return;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    setText(raw);
    const parsed = parseManual(raw);
    if (parsed) onChange(parsed);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative w-full">
        <input
          type="text"
          value={text}
          onChange={handleInputChange}
          disabled={readOnly || disabled}
          placeholder={placeholder}
          className={cn(
            'flex items-center justify-between gap-2 w-full px-3 py-2.5 text-sm rounded-lg border bg-[rgba(255,255,255,0.04)] border-[rgba(123,63,191,0.2)] text-[#F8FAFC] focus:outline-none focus:border-[#7B3FBF] transition-all disabled:cursor-not-allowed disabled:opacity-60 pr-9',
            className
          )}
        />
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={readOnly || disabled}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#F8FAFC]/40 hover:text-[#7B3FBF] transition-colors disabled:cursor-not-allowed"
          >
            <CalendarIcon size={14} />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0 bg-[#0D1B3E] border-[rgba(123,63,191,0.25)]" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleCalendarSelect}
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
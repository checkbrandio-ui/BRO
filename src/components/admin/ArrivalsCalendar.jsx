import { useState, useMemo } from 'react';
import { Calendar, MapPin, Users, ChevronDown, ChevronUp, Clock } from 'lucide-react';

/**
 * Панель-календарь прибытия кандидатов.
 * Показывает предстоящие прибытия, сгруппированные по дате и точке сбора.
 */
export default function ArrivalsCalendar({ candidates }) {
  const [expanded, setExpanded] = useState(false);

  const arrivals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return candidates
      .filter(c => c.arrival_date && !c.is_archived)
      .map(c => {
        const d = new Date(c.arrival_date);
        d.setHours(0, 0, 0, 0);
        return { ...c, _date: d };
      })
      .filter(c => c._date >= today)
      .sort((a, b) => a._date - b._date);
  }, [candidates]);

  // Группировка по дате
  const grouped = useMemo(() => {
    const map = {};
    arrivals.forEach(c => {
      const key = c.arrival_date;
      if (!map[key]) map[key] = { date: c.arrival_date, candidates: [] };
      map[key].candidates.push(c);
    });
    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [arrivals]);

  const totalCount = arrivals.length;
  const upcomingCount = grouped.length;

  if (totalCount === 0) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.getTime() === today.getTime()) return 'Сегодня';
    if (d.getTime() === tomorrow.getTime()) return 'Завтра';

    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <div className="mb-6 glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[rgba(123,63,191,0.05)] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Calendar size={16} className="text-[#C9A84C]" />
          <span className="text-sm font-bold text-[#F8FAFC]">Прибытия кандидатов</span>
          <span className="text-xs text-[#F8FAFC]/40">
            {totalCount} чел. · {upcomingCount} {upcomingCount === 1 ? 'дата' : 'дней'}
          </span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-[#F8FAFC]/40" /> : <ChevronDown size={16} className="text-[#F8FAFC]/40" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 max-h-[400px] overflow-y-auto">
          {grouped.map(group => {
            // Подгруппировка по точке сбора
            const byPoint = {};
            group.candidates.forEach(c => {
              const point = c.assembly_point || 'Без точки сбора';
              if (!byPoint[point]) byPoint[point] = [];
              byPoint[point].push(c);
            });

            return (
              <div key={group.date} className="border-l-2 border-[#C9A84C]/30 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={13} className="text-[#C9A84C]" />
                  <span className="text-sm font-bold text-[#C9A84C]">{formatDate(group.date)}</span>
                  <span className="text-xs text-[#F8FAFC]/30">· {group.candidates.length} чел.</span>
                </div>
                {Object.entries(byPoint).map(([point, cands]) => (
                  <div key={point} className="mb-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin size={11} className="text-[#7B3FBF]" />
                      <span className="text-xs font-medium text-[#7B3FBF]">{point}</span>
                      <span className="text-xs text-[#F8FAFC]/30">({cands.length})</span>
                    </div>
                    <div className="space-y-0.5 ml-4">
                      {cands.map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-xs text-[#F8FAFC]/55">
                          <Users size={10} className="opacity-30" />
                          <span className="truncate">{c.full_name}</span>
                          {c.arrival_time && (
                            <span className="text-[#F8FAFC]/30 flex items-center gap-0.5 flex-shrink-0">
                              <Clock size={9} /> {c.arrival_time}
                            </span>
                          )}
                          {c.logistics_status === 'confirmed' && (
                            <span className="text-green-400 text-[10px] flex-shrink-0">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
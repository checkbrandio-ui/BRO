import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { History, Loader2, MapPin, Calendar, Clock, CheckCircle, X } from 'lucide-react';
import { LOGISTICS_STATUS } from '@/lib/candidateConstants';

/**
 * Отображает полную историю согласований логистики для кандидата.
 * Берёт данные из CandidateLog, фильтрует по logistics-полям.
 */
export default function LogisticsHistory({ candidateId, candidateName }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!candidateId) return;
    setLoading(true);
    base44.entities.CandidateLog.filter({ candidate_id: candidateId }, '-timestamp', 100)
      .then(records => {
        // Фильтруем только логи, связанные с логистикой
        const logisticsLogs = records.filter(r => {
          if (!r.changes) return false;
          try {
            const parsed = JSON.parse(r.changes);
            const logisticsFields = [
              'logistics_status', 'assembly_point', 'arrival_date', 'arrival_time',
              'proposed_assembly_point', 'proposed_arrival_date', 'proposed_arrival_time',
              'proposed_by', 'logistics_confirmed_at', 'ticket_photo_url',
              'assembly_distance',
            ];
            return logisticsFields.some(f => parsed[f]);
          } catch { return false; }
        });
        setLogs(logisticsLogs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#F8FAFC]/40 py-2">
        <Loader2 size={12} className="animate-spin" /> Загрузка истории...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#F8FAFC]/30 py-2">
        <History size={12} /> История согласований пуста
      </div>
    );
  }

  const formatLogEntry = (log) => {
    let details = [];
    try {
      const parsed = JSON.parse(log.changes);
      const fieldLabels = {
        logistics_status: 'Статус',
        assembly_point: 'Пункт сбора',
        arrival_date: 'Дата',
        arrival_time: 'Время',
        proposed_assembly_point: 'Предложен пункт',
        proposed_arrival_date: 'Предложена дата',
        proposed_arrival_time: 'Предложено время',
        proposed_by: 'Инициатор предложения',
        logistics_confirmed_at: 'Подтверждено в',
        ticket_photo_url: 'Фото билета',
        assembly_distance: 'Расстояние',
      };
      for (const [field, change] of Object.entries(parsed)) {
        if (fieldLabels[field]) {
          details.push({ label: fieldLabels[field], from: change.from, to: change.to });
        }
      }
    } catch {}
    return details;
  };

  return (
    <div className="rounded-xl bg-[rgba(123,63,191,0.04)] border border-[rgba(123,63,191,0.15)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[rgba(123,63,191,0.08)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <History size={13} className="text-[#7B3FBF]" />
          <span className="text-xs font-bold text-[#7B3FBF] uppercase tracking-widest">
            История согласований ({logs.length})
          </span>
        </div>
        <span className="text-xs text-[#F8FAFC]/30">{expanded ? 'Свернуть' : 'Развернуть'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 max-h-[300px] overflow-y-auto">
          {logs.map((log, idx) => {
            const details = formatLogEntry(log);
            const statusChange = details.find(d => d.label === 'Статус');
            const actorLabel = log.changed_by_role === 'candidate'
              ? 'Кандидат'
              : log.changed_by_role === 'agency'
                ? `Агентство${log.agency_name ? ` (${log.agency_name})` : ''}`
                : log.changed_by_role === 'manager'
                  ? 'Менеджер'
                  : 'Администратор';
            return (
              <div key={log.id || idx} className="relative pl-5 pb-3 border-l border-[rgba(123,63,191,0.2)]">
                <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-[#7B3FBF]" />
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#F8FAFC]/70">{actorLabel}</span>
                  <span className="text-xs text-[#F8FAFC]/30">·</span>
                  <span className="text-xs text-[#F8FAFC]/40">{log.changed_by_name}</span>
                </div>
                <div className="text-[10px] text-[#F8FAFC]/30 mb-1.5">
                  {new Date(log.timestamp).toLocaleString('ru-RU')}
                </div>
                {details.length > 0 ? (
                  <div className="space-y-0.5">
                    {details.map((d, i) => (
                      <div key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-[#F8FAFC]/40 min-w-[100px]">{d.label}:</span>
                        <span className="text-[#F8FAFC]/50 line-through">{d.from || '—'}</span>
                        <span className="text-[#7B3FBF]">→</span>
                        <span className="text-[#F8FAFC]/80">{d.to || '—'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#F8FAFC]/30">Изменение зафиксировано</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
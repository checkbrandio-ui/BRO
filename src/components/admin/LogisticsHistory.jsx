import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, MapPin, Calendar, Clock, CheckCircle, XCircle, History, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

/**
 * История согласований логистики — единый хронологический список.
 * Каждая запись = факт действия + конкретные данные (город, дата, время).
 * Берётся из CandidateLog (включает действия и админа, и кандидата).
 */
export default function LogisticsHistory({ candidateId, defaultExpanded = false }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (!candidateId) return;
    setLoading(true);
    base44.entities.CandidateLog.filter({ candidate_id: candidateId }, '-timestamp', 100)
      .then(records => {
        const logisticsLogs = records.filter(r => {
          if (!r.changes) return false;
          try {
            const parsed = JSON.parse(r.changes);
            const logisticsFields = [
              'logistics_status', 'assembly_point', 'arrival_date', 'arrival_time',
              'proposed_assembly_point', 'proposed_arrival_date', 'proposed_arrival_time',
              'proposed_by', 'logistics_confirmed_at', 'ticket_photo_url', 'assembly_distance',
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

  /**
   * Извлекает из записи лога человекочитаемое описание действия + данные логистики.
   */
  const describeLog = (log) => {
    let parsed = {};
    try { parsed = JSON.parse(log.changes || '{}'); } catch {}

    const get = (key) => parsed[key]?.to ?? '';
    const statusTo = get('logistics_status');
    const point = get('proposed_assembly_point') || get('assembly_point');
    const date = get('proposed_arrival_date') || get('arrival_date');
    const time = get('proposed_arrival_time') || get('arrival_time');
    const proposedBy = get('proposed_by');

    const role = log.changed_by_role;
    const actorLabel = role === 'candidate' ? 'Кандидат'
      : role === 'agency' ? `Агентство${log.agency_name ? ` (${log.agency_name})` : ''}`
      : role === 'manager' ? 'Менеджер'
      : 'Администратор';

    // Описание действия в зависимости от перехода статуса
    let action = '';
    let icon = <ArrowRight size={11} className="text-[#7B3FBF]" />;

    if (statusTo === 'pending_candidate') {
      action = proposedBy === 'admin' ? 'предложил логистику кандидату' : 'отправил данные на согласование';
      icon = <Calendar size={11} className="text-[#C9A84C]" />;
    } else if (statusTo === 'pending_admin') {
      action = 'предложил новые данные, ожидает согласования администратора';
      icon = <Clock size={11} className="text-[#C9A84C]" />;
    } else if (statusTo === 'confirmed') {
      action = 'согласовал логистику';
      icon = <CheckCircle size={11} className="text-green-400" />;
    } else if (statusTo === 'none') {
      action = 'сбросил согласование (пересогласование)';
      icon = <XCircle size={11} className="text-red-400" />;
    } else if (!statusTo && (point || date || time)) {
      action = 'изменил данные логистики';
      icon = <ArrowRight size={11} className="text-[#7B3FBF]" />;
    } else {
      action = 'действие зафиксировано';
    }

    return { actorLabel, action, icon, point, date, time };
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
        <div className="px-4 pb-4 space-y-3 max-h-[300px] overflow-y-auto">
          {logs.map((log, idx) => {
            const { actorLabel, action, icon, point, date, time } = describeLog(log);
            return (
              <div key={log.id || idx} className="relative pl-5 border-l border-[rgba(123,63,191,0.2)]">
                <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-[#7B3FBF]" />
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-bold text-[#F8FAFC]/70">{actorLabel}</span>
                  <span className="text-[#F8FAFC]/30">·</span>
                  <span className="text-xs text-[#F8FAFC]/50 flex items-center gap-1">{icon} {action}</span>
                </div>
                <div className="text-[10px] text-[#F8FAFC]/30 mb-1.5">
                  {new Date(log.timestamp).toLocaleString('ru-RU')}
                </div>
                {(point || date || time) && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#F8FAFC]/60">
                    {point && <span className="flex items-center gap-1"><MapPin size={10} className="text-[#7B3FBF]/60" /> {point}</span>}
                    {date && <span className="flex items-center gap-1"><Calendar size={10} className="text-[#7B3FBF]/60" /> {formatDate(date)}</span>}
                    {time && <span className="flex items-center gap-1"><Clock size={10} className="text-[#7B3FBF]/60" /> {time}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
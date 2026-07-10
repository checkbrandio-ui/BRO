/**
 * Логирование действий с кандидатами.
 * Вызывается из Candidates.jsx, AgencyWorkspace.jsx и CandidateModal.jsx.
 *
 * Для изменений логистики записывает _snapshot — текущее состояние
 * ключевых полей логистики, чтобы в истории было видно
 * финальный результат изменений, а не только факт изменения.
 */
import { base44 } from '@/api/base44Client';

const LOGISTICS_FIELDS = [
  'logistics_status', 'assembly_point', 'arrival_date', 'arrival_time',
  'proposed_assembly_point', 'proposed_arrival_date', 'proposed_arrival_time',
  'proposed_by', 'logistics_confirmed_at', 'ticket_photo_url', 'assembly_distance',
  'final_call_confirmed', 'final_call_confirmed_at',
];

const ALL_FIELDS = [
  'full_name','position','phone','email','birth_date','citizenship','birth_place',
  'gender','health_status','health_details','city','assembly_point','assembly_distance',
  'arrival_date','arrival_time','ticket_photo_url','logistics_status','logistics_confirmed_at',
  'proposed_assembly_point','proposed_arrival_date','proposed_arrival_time','proposed_by',
  'sb_check','medical_check','comment','payment_basis','payment_made',
  'agency_id','agency_name','is_archived','deleted_at','form_token','form_status','form_submitted_at',
  'final_call_confirmed','final_call_confirmed_at',
];

/**
 * action: 'create' | 'update' | 'delete'
 * candidate: объект кандидата (новое состояние)
 * oldData: предыдущее состояние (для update)
 * actor: { name, role: 'admin'|'agency', agency_name? }
 */
export async function logCandidateAction({ action, candidate, oldData, actor }) {
  let changes = null;

  if (action === 'update' && oldData) {
    const diff = {};
    for (const f of ALL_FIELDS) {
      if (String(oldData[f] ?? '') !== String(candidate[f] ?? '')) {
        diff[f] = { from: oldData[f] ?? '', to: candidate[f] ?? '' };
      }
    }

    // Если есть изменения логистики — добавляем snapshot текущего состояния
    const hasLogisticsChange = Object.keys(diff).some(k => LOGISTICS_FIELDS.includes(k));
    if (hasLogisticsChange) {
      diff._snapshot = {
        assembly_point: candidate.assembly_point || '',
        arrival_date: candidate.arrival_date || '',
        arrival_time: candidate.arrival_time || '',
        logistics_status: candidate.logistics_status || '',
        final_call_confirmed: candidate.final_call_confirmed || false,
      };
    }

    changes = Object.keys(diff).length > 0 ? JSON.stringify(diff) : null;
    if (!changes) return; // Ничего не изменилось — лог не нужен
  }

  await base44.entities.CandidateLog.create({
    candidate_id: candidate.id || 'new',
    candidate_name: candidate.full_name || '',
    action,
    changed_by_name: actor?.name || 'Неизвестно',
    changed_by_role: actor?.role || 'admin',
    agency_name: actor?.agency_name || '',
    changes: changes || '',
    timestamp: new Date().toISOString(),
  });
}
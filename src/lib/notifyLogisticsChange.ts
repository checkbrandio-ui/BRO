import { apiClient } from '@/api/base44Client';
import type { Candidate, Actor } from './types';

/**
 * Создаёт in-app уведомления и отправляет email при изменении статуса логистики.
 *
 * FSM (две стороны согласования: Карточка vs Анкета):
 * — none → pending_candidate: админ предложил → уведомляем кандидата
 * — none → pending_admin: кандидат указал данные → уведомляем админа
 * — pending_admin → confirmed: админ подтвердил → уведомляем кандидата
 * — pending_candidate → confirmed: кандидат согласовал → уведомляем админа
 * — none → confirmed: утверждено без согласования → уведомляем кандидата
 * — confirmed → pending_*: пересогласование → уведомляем противоположную сторону
 */
export async function notifyLogisticsChange(
  newData: Candidate,
  oldData: Candidate | null,
  actor: Actor | null = null
): Promise<void> {
  if (!oldData) return;

  const oldStatus = oldData.logistics_status || 'none';
  const newStatus = newData.logistics_status || 'none';

  const logisticsFieldsChanged =
    oldStatus === 'confirmed' &&
    newStatus === 'confirmed' &&
    (String(oldData.assembly_point || '') !== String(newData.assembly_point || '') ||
      String(oldData.arrival_date || '') !== String(newData.arrival_date || '') ||
      String(oldData.arrival_time || '') !== String(newData.arrival_time || ''));

  if (logisticsFieldsChanged) {
    newData.logistics_status = 'pending_admin';
  }

  if (oldStatus === newStatus && !logisticsFieldsChanged) return;

  const candidateName = newData.full_name || 'Кандидат';
  const candidateId = newData.id || '';
  const now = new Date().toLocaleString('ru-RU');
  const actorName = actor?.name || 'Система';
  const actorRole = actor?.role || '';

  let message = '';
  let notifyCandidate = false;
  let notifyAdmin = false;

  if (logisticsFieldsChanged || (oldStatus === 'confirmed' && (newStatus === 'pending_admin' || newStatus === 'pending_candidate'))) {
    if (newStatus === 'pending_admin') {
      message = `📍 Кандидат «${candidateName}» изменил данные логистики после согласования. Требуется пересогласование.`;
      notifyAdmin = true;
    } else {
      message = `📍 Администратор инициировал пересогласование логистики для «${candidateName}». Требуется согласование.`;
      notifyCandidate = true;
    }
  } else if (newStatus === 'pending_candidate') {
    message = `📍 Администратор предложил логистику для «${candidateName}». Требуется ваше согласование.`;
    notifyCandidate = true;
  } else if (newStatus === 'pending_admin') {
    message = `📍 Кандидат «${candidateName}» указал данные логистики. Требуется согласование администратором.`;
    notifyAdmin = true;
  } else if (newStatus === 'confirmed') {
    if (oldStatus === 'pending_admin') {
      message = `✓ Администратор согласовал логистику для «${candidateName}».`;
      notifyCandidate = true;
    } else if (oldStatus === 'pending_candidate') {
      message = `✓ Кандидат «${candidateName}» согласовал предложенную логистику.`;
      notifyAdmin = true;
    } else {
      message = `✓ Логистика утверждена для «${candidateName}».`;
      notifyCandidate = true;
    }
  }

  if (!message) return;

  const notifBase = {
    candidate_id: candidateId,
    candidate_name: candidateName,
    message,
    link: '/admin/candidates',
    is_read: false,
    category: 'logistics',
    actor_name: actorName,
    actor_role: actorRole,
  };

  try {
    if (notifyCandidate) {
      await apiClient.post('/api/notifications', {
        ...notifBase,
        agency_id: newData.agency_id || '',
        agency_name: newData.agency_name || '',
      });

      if (newData.email) {
        const logisticsDetails = formatLogisticsDetails(newData);
        apiClient.post('/api/integrations/send-email', {
          to: newData.email,
          subject: `Логистика: ${candidateName}`,
          body: `${message}\n\n${logisticsDetails}\n\nИнициатор: ${actorName}\nДата: ${now}\n\nДля согласования перейдите в анкету: ${window.location.origin}/form/${newData.form_token || ''}`,
          from_name: 'БРО-СНБ',
        }).catch(() => {});
      }

      if (newData.agency_id) {
        apiClient.get(`/api/agencies/${newData.agency_id}`)
          .then((agency: any) => {
            if (!agency) return;
            const emails = [agency.email, agency.manager_email].filter(Boolean) as string[];
            return Promise.allSettled(
              emails.map((email) =>
                apiClient.post('/api/integrations/send-email', {
                  to: email,
                  subject: `Логистика: ${candidateName}`,
                  body: `${message}\n\nИнициатор: ${actorName}\nДата: ${now}`,
                  from_name: 'БРО-СНБ',
                })
              )
            );
          })
          .catch(() => {});
      }
    }

    if (notifyAdmin) {
      await apiClient.post('/api/notifications', notifBase);

      apiClient.get('/api/users?role=admin&limit=100')
        .then(async (admins: any[]) => {
          const moderators = await apiClient.get('/api/users?role=moderator&limit=100').catch(() => []);
          const emailBody = `${message}\n\n${formatLogisticsDetails(newData)}\n\nИнициатор: ${actorName}\nДата: ${now}`;
          const recipients = [...(admins || []), ...(moderators || [])]
            .filter((u: any) => u?.email)
            .map((u: any) => u.email);
          return Promise.allSettled(
            recipients.map((email: string) =>
              apiClient.post('/api/integrations/send-email', {
                to: email,
                subject: `Логистика: ${candidateName}`,
                body: emailBody,
                from_name: 'БРО-СНБ',
              }).catch(() => {})
            )
          );
        })
        .catch(() => {});
    }
  } catch {
    // Silent — нотификации не должны блокировать основное действие
  }
}

function formatLogisticsDetails(data: Candidate): string {
  const lines: string[] = [];
  if (data.proposed_assembly_point || data.assembly_point) {
    lines.push(`📍 Пункт сбора: ${data.proposed_assembly_point || data.assembly_point}`);
  }
  if (data.proposed_arrival_date || data.arrival_date) {
    lines.push(`📅 Дата прибытия: ${data.proposed_arrival_date || data.arrival_date}`);
  }
  if (data.proposed_arrival_time || data.arrival_time) {
    lines.push(`⏰ Время прибытия: ${data.proposed_arrival_time || data.arrival_time}`);
  }
  return lines.length > 0 ? lines.join('\n') : 'Данные логистики не указаны';
}

import { apiClient } from '@/api/base44Client';
import type { Candidate, Actor } from './types';

/**
 * Уведомляет агентство и админов о финальном прозвоне кандидата.
 * Также отправляет email кандидату (если есть email).
 */
export async function notifyFinalCallConfirmed(
  candidate: Candidate | null,
  actor: Actor | null = null
): Promise<void> {
  if (!candidate) return;

  const candidateName = candidate.full_name || 'Кандидат';
  const candidateId = candidate.id || '';
  const now = new Date().toLocaleString('ru-RU');
  const actorName = actor?.name || 'Система';
  const actorRole = actor?.role || '';

  const message = `📞 Финальное согласование: кандидат «${candidateName}» подтвердил дату выезда/прибытия по телефону.`;

  const notifBase = {
    candidate_id: candidateId,
    candidate_name: candidateName,
    message,
    link: '/admin/candidates',
    is_read: false,
    category: 'final_call',
    actor_name: actorName,
    actor_role: actorRole,
  };

  try {
    // Уведомление агентству
    if (candidate.agency_id) {
      await apiClient.post('/api/notifications', {
        ...notifBase,
        agency_id: candidate.agency_id,
        agency_name: candidate.agency_name || '',
      });

      // Email агентству
      apiClient.get(`/api/agencies/${candidate.agency_id}`)
        .then((agency: any) => {
          if (!agency) return;
          const emails = [agency.email, agency.manager_email].filter(Boolean) as string[];
          return Promise.allSettled(
            emails.map((email) =>
              apiClient.post('/api/integrations/send-email', {
                to: email,
                subject: `Финальный прозвон: ${candidateName}`,
                body: `${message}\n\nИнициатор: ${actorName}\nДата: ${now}`,
                from_name: 'БРО-СНБ',
              })
            )
          );
        })
        .catch(() => {});
    }

    // Уведомление админам
    await apiClient.post('/api/notifications', notifBase);

    // Email кандидату
    if (candidate.email) {
      apiClient.post('/api/integrations/send-email', {
        to: candidate.email,
        subject: 'Финальное подтверждение',
        body: `Уважаемый(ая) ${candidateName},\n\nВаша дата выезда/прибытия подтверждена.\n\nДата: ${now}`,
        from_name: 'БРО-СНБ',
      }).catch(() => {});
    }
  } catch {
    // Silent — нотификации не должны блокировать основное действие
  }
}

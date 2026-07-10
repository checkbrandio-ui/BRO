import { base44 } from '@/api/base44Client';
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
    category: 'logistics',
    actor_name: actorName,
    actor_role: actorRole,
    agency_id: candidate.agency_id || '',
    agency_name: candidate.agency_name || '',
  };

  try {
    await base44.entities.Notification.create(notifBase);

    const emailPromises: Promise<unknown>[] = [];

    if (candidate.agency_id) {
      const agencies = await base44.entities.Agency.filter({ id: candidate.agency_id });
      const agency = agencies[0];
      if (agency) {
        const emails = [agency.email, agency.manager_email].filter(Boolean) as string[];
        emails.forEach((email) =>
          emailPromises.push(
            base44.integrations.Core.SendEmail({
              to: email,
              subject: `Финальное согласование: ${candidateName}`,
              body: `${message}\n\nИнициатор: ${actorName}\nДата: ${now}`,
              from_name: 'БРО-СНБ',
            }).catch(() => {})
          )
        );
      }
    }

    try {
      const admins = await base44.entities.User.filter({ role: 'admin' });
      admins
        .filter((a: { email?: string }) => a.email)
        .forEach((a: { email: string }) =>
          emailPromises.push(
            base44.integrations.Core.SendEmail({
              to: a.email,
              subject: `Финальное согласование: ${candidateName}`,
              body: `${message}\n\nИнициатор: ${actorName}\nДата: ${now}`,
              from_name: 'БРО-СНБ',
            }).catch(() => {})
          )
        );
      try {
        const moderators = await base44.entities.User.filter({ role: 'moderator' });
        moderators
          .filter((m: { email?: string }) => m.email)
          .forEach((m: { email: string }) =>
            emailPromises.push(
              base44.integrations.Core.SendEmail({
                to: m.email,
                subject: `Финальное согласование: ${candidateName}`,
                body: `${message}\n\nИнициатор: ${actorName}\nДата: ${now}`,
                from_name: 'БРО-СНБ',
              }).catch(() => {})
            )
          );
      } catch {}
    } catch {}

    if (candidate.email) {
      emailPromises.push(
        base44.integrations.Core.SendEmail({
          to: candidate.email,
          subject: `Ваша поездка согласована — ${candidateName}`,
          body: `Здравствуйте, ${candidateName}!\n\nВаши дата выезда и прибытия окончательно согласованы.\n\n${formatLogisticsDetails(candidate)}\n\nС уважением,\nООО «БРО-СНБ»`,
          from_name: 'БРО-СНБ',
        }).catch(() => {})
      );
    }

    await Promise.allSettled(emailPromises);
  } catch {
    // Silent
  }
}

function formatLogisticsDetails(data: Candidate): string {
  const lines: string[] = [];
  if (data.assembly_point) lines.push(`📍 Пункт сбора: ${data.assembly_point}`);
  if (data.arrival_date) lines.push(`📅 Дата прибытия: ${data.arrival_date.split('-').reverse().join('.')}`);
  if (data.arrival_time) lines.push(`⏰ Время прибытия: ${data.arrival_time}`);
  return lines.length > 0 ? lines.join('\n') : 'Детали логистики уточняются.';
}
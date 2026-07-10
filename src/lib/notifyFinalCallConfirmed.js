import { base44 } from '@/api/base44Client';

/**
 * Уведомляет агентство и админов о финальном прозвоне кандидата.
 * Также отправляет email кандидату (если есть email).
 *
 * @param {object} candidate — данные кандидата (с final_call_confirmed = true)
 * @param {object} actor — { name, role } инициатор
 */
export async function notifyFinalCallConfirmed(candidate, actor = null) {
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
    // In-app уведомление (агентство + админ видят)
    await base44.entities.Notification.create(notifBase);

    // Email агентству
    const emailPromises = [];
    if (candidate.agency_id) {
      const agencies = await base44.entities.Agency.filter({ id: candidate.agency_id });
      const agency = agencies[0];
      if (agency) {
        const emails = [agency.email, agency.manager_email].filter(Boolean);
        emails.forEach(email =>
          emailPromises.push(base44.integrations.Core.SendEmail({
            to: email,
            subject: `Финальное согласование: ${candidateName}`,
            body: `${message}\n\nИнициатор: ${actorName}\nДата: ${now}`,
            from_name: 'БРО-СНБ',
          }).catch(() => {}))
        );
      }
    }

    // Email админам и модераторам
    try {
      const admins = await base44.entities.User.filter({ role: 'admin' });
      admins.filter(a => a.email).forEach(a =>
        emailPromises.push(base44.integrations.Core.SendEmail({
          to: a.email,
          subject: `Финальное согласование: ${candidateName}`,
          body: `${message}\n\nИнициатор: ${actorName}\nДата: ${now}`,
          from_name: 'БРО-СНБ',
        }).catch(() => {}))
      );
      try {
        const moderators = await base44.entities.User.filter({ role: 'moderator' });
        moderators.filter(m => m.email).forEach(m =>
          emailPromises.push(base44.integrations.Core.SendEmail({
            to: m.email,
            subject: `Финальное согласование: ${candidateName}`,
            body: `${message}\n\nИнициатор: ${actorName}\nДата: ${now}`,
            from_name: 'БРО-СНБ',
          }).catch(() => {}))
        );
      } catch (_) {}
    } catch (_) {}

    // Email кандидату
    if (candidate.email) {
      emailPromises.push(base44.integrations.Core.SendEmail({
        to: candidate.email,
        subject: `Ваша поездка согласована — ${candidateName}`,
        body: `Здравствуйте, ${candidateName}!\n\nВаши дата выезда и прибытия окончательно согласованы.\n\n${formatLogisticsDetails(candidate)}\n\nС уважением,\nООО «БРО-СНБ»`,
        from_name: 'БРО-СНБ',
      }).catch(() => {}));
    }

    await Promise.allSettled(emailPromises);
  } catch (_) {
    // Silent
  }
}

function formatLogisticsDetails(data) {
  const lines = [];
  if (data.assembly_point) lines.push(`📍 Пункт сбора: ${data.assembly_point}`);
  if (data.arrival_date) lines.push(`📅 Дата прибытия: ${data.arrival_date.split('-').reverse().join('.')}`);
  if (data.arrival_time) lines.push(`⏰ Время прибытия: ${data.arrival_time}`);
  return lines.length > 0 ? lines.join('\n') : 'Детали логистики уточняются.';
}
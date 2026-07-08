import { base44 } from '@/api/base44Client';
import { LOGISTICS_STATUS } from '@/lib/candidateConstants';

/**
 * Создаёт in-app уведомления и отправляет email при изменении статуса логистики.
 * Сценарии:
 * — none → pending_candidate: админ предложил → уведомляем агентство (менеджера)
 * — none → pending_admin: кандидат/менеджер указал данные → уведомляем админа
 * — pending_admin → confirmed: админ подтвердил → уведомляем агентство
 * — pending_candidate → confirmed: кандидат согласовал → уведомляем админа
 * — none → confirmed: админ утвердил без согласования → уведомляем агентство
 */
export async function notifyLogisticsChange(newData, oldData) {
  if (!oldData) return;

  const oldStatus = oldData.logistics_status || 'none';
  const newStatus = newData.logistics_status || 'none';
  if (oldStatus === newStatus) return;

  const candidateName = newData.full_name || 'Кандидат';
  const candidateId = newData.id || '';
  const now = new Date().toLocaleString('ru-RU');

  let message = '';
  let notifyAgency = false;
  let notifyAdmin = false;

  if (newStatus === 'pending_candidate') {
    message = `📍 Администратор предложил логистику для «${candidateName}». Требуется согласование.`;
    notifyAgency = true;
  } else if (newStatus === 'pending_admin') {
    message = `📍 Кандидат «${candidateName}» указал данные логистики. Требуется согласование администратором.`;
    notifyAdmin = true;
  } else if (newStatus === 'confirmed') {
    if (oldStatus === 'pending_admin') {
      message = `✓ Администратор согласовал логистику для «${candidateName}».`;
      notifyAgency = true;
    } else if (oldStatus === 'pending_candidate') {
      message = `✓ Кандидат «${candidateName}» согласовал предложенную логистику.`;
      notifyAdmin = true;
    } else {
      message = `✓ Логистика согласована для «${candidateName}».`;
      notifyAgency = true;
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
  };

  try {
    if (notifyAgency && newData.agency_id) {
      await base44.entities.Notification.create({
        ...notifBase,
        agency_id: newData.agency_id,
        agency_name: newData.agency_name || '',
      });
      const agencies = await base44.entities.Agency.filter({ id: newData.agency_id });
      const agency = agencies[0];
      if (agency) {
        const emails = [agency.email, agency.manager_email].filter(Boolean);
        await Promise.allSettled(emails.map(email =>
          base44.integrations.Core.SendEmail({ to: email, subject: `Логистика: ${candidateName}`, body: `${message}\n\nДата: ${now}`, from_name: 'Bratouveriye SNB' })
        ));
      }
    }

    if (notifyAdmin) {
      await base44.entities.Notification.create(notifBase);
      const admins = await base44.entities.User.filter({ role: 'admin' });
      await Promise.allSettled(
        admins.filter(a => a.email).map(a =>
          base44.integrations.Core.SendEmail({ to: a.email, subject: `Логистика: ${candidateName}`, body: `${message}\n\nДата: ${now}`, from_name: 'Bratouveriye SNB' })
        )
      );
    }
  } catch (e) {
    // Silent
  }
}
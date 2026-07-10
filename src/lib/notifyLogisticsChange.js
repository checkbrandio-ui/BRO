import { base44 } from '@/api/base44Client';
import { LOGISTICS_STATUS } from '@/lib/candidateConstants';

/**
 * Создаёт in-app уведомления и отправляет email при изменении статуса логистики.
 * @param newData - новые данные кандидата
 * @param oldData - предыдущие данные кандидата
 * @param actor - { name, role } инициатор действия
 *
 * FSM (две стороны согласования: Карточка vs Анкета):
 * — none → pending_candidate: админ (сторона А) предложил → уведомляем кандидата (сторона Б)
 * — none → pending_admin: кандидат (сторона Б) указал данные → уведомляем админа (сторона А)
 * — pending_admin → confirmed: админ подтвердил → уведомляем кандидата
 * — pending_candidate → confirmed: кандидат согласовал → уведомляем админа
 * — none → confirmed: админ утвердил без согласования → уведомляем кандидата
 * — confirmed → pending_admin/pending_candidate: пересогласование → уведомляем противоположную сторону
 */
export async function notifyLogisticsChange(newData, oldData, actor = null) {
  if (!oldData) return;

  const oldStatus = oldData.logistics_status || 'none';
  const newStatus = newData.logistics_status || 'none';

  // Проверяем изменение полей логистики при подтверждённом статусе
  const logisticsFieldsChanged = oldStatus === 'confirmed' && newStatus === 'confirmed' && (
    String(oldData.assembly_point || '') !== String(newData.assembly_point || '') ||
    String(oldData.arrival_date || '') !== String(newData.arrival_date || '') ||
    String(oldData.arrival_time || '') !== String(newData.arrival_time || '')
  );

  // Если логистика была подтверждена, но поля изменились — переводим в pending_admin
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
  let notifyCandidate = false; // сторона Б (анкета)
  let notifyAdmin = false;     // сторона А (карточка)

  if (logisticsFieldsChanged || (oldStatus === 'confirmed' && (newStatus === 'pending_admin' || newStatus === 'pending_candidate'))) {
    // Пересогласование
    if (newStatus === 'pending_admin') {
      message = `📍 Кандидат «${candidateName}» изменил данные логистики после согласования. Требуется пересогласование.`;
      notifyAdmin = true;
    } else {
      message = `📍 Администратор инициировал пересогласование логистики для «${candidateName}». Требуется согласование.`;
      notifyCandidate = true;
    }
  } else if (newStatus === 'pending_candidate') {
    // Админ предложил → ждём кандидата
    message = `📍 Администратор предложил логистику для «${candidateName}». Требуется ваше согласование.`;
    notifyCandidate = true;
  } else if (newStatus === 'pending_admin') {
    // Кандидат предложил → ждём админа
    message = `📍 Кандидат «${candidateName}» указал данные логистики. Требуется согласование администратором.`;
    notifyAdmin = true;
  } else if (newStatus === 'confirmed') {
    if (oldStatus === 'pending_admin') {
      // Админ подтвердил предложение кандидата
      message = `✓ Администратор согласовал логистику для «${candidateName}».`;
      notifyCandidate = true;
    } else if (oldStatus === 'pending_candidate') {
      // Кандидат согласовал предложение админа
      message = `✓ Кандидат «${candidateName}» согласовал предложенную логистику.`;
      notifyAdmin = true;
    } else {
      // Утверждено без согласования
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
    // Уведомление кандидату (сторона Б)
    if (notifyCandidate) {
      await base44.entities.Notification.create({
        ...notifBase,
        agency_id: newData.agency_id || '',
        agency_name: newData.agency_name || '',
      });
      // Email кандидату
      if (newData.email) {
        const logisticsDetails = formatLogisticsDetails(newData);
        await base44.integrations.Core.SendEmail({
          to: newData.email,
          subject: `Логистика: ${candidateName}`,
          body: `${message}\n\n${logisticsDetails}\n\nИнициатор: ${actorName}\nДата: ${now}\n\nДля согласования перейдите в анкету: ${window.location.origin}/form/${newData.form_token || ''}`,
          from_name: 'БРО-СНБ',
        }).catch(() => {});
      }
      // Также уведомляем агентство
      if (newData.agency_id) {
        const agencies = await base44.entities.Agency.filter({ id: newData.agency_id });
        const agency = agencies[0];
        if (agency) {
          const emails = [agency.email, agency.manager_email].filter(Boolean);
          await Promise.allSettled(emails.map(email =>
            base44.integrations.Core.SendEmail({ to: email, subject: `Логистика: ${candidateName}`, body: `${message}\n\nИнициатор: ${actorName}\nДата: ${now}`, from_name: 'БРО-СНБ' })
          ));
        }
      }
    }

    // Уведомление админу (сторона А)
    if (notifyAdmin) {
      await base44.entities.Notification.create(notifBase);
      // Email админам и модераторам
      try {
        const admins = await base44.entities.User.filter({ role: 'admin' });
        const emailPromises = admins
          .filter(a => a.email)
          .map(a => base44.integrations.Core.SendEmail({
            to: a.email,
            subject: `Логистика: ${candidateName}`,
            body: `${message}\n\n${formatLogisticsDetails(newData)}\n\nИнициатор: ${actorName}\nДата: ${now}`,
            from_name: 'БРО-СНБ',
          }).catch(() => {}));
        try {
          const moderators = await base44.entities.User.filter({ role: 'moderator' });
          moderators.filter(m => m.email).forEach(m =>
            emailPromises.push(base44.integrations.Core.SendEmail({
              to: m.email,
              subject: `Логистика: ${candidateName}`,
              body: `${message}\n\n${formatLogisticsDetails(newData)}\n\nИнициатор: ${actorName}\nДата: ${now}`,
              from_name: 'БРО-СНБ',
            }).catch(() => {}))
          );
        } catch (_) {}
        await Promise.allSettled(emailPromises);
      } catch (_) {}
    }
  } catch (e) {
    // Silent
  }
}

function formatLogisticsDetails(data) {
  const lines = [];
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
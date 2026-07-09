import { base44 } from '@/api/base44Client';

/**
 * Создаёт in-app уведомление и отправляет email при изменении статуса кандидата.
 * @param newData - новые данные кандидата
 * @param oldData - предыдущие данные
 * @param actor - { name, role } инициатор
 * Проверяет поля: sb_check, medical_check, payment_basis, payment_made.
 */
export async function notifyStatusChange(newData, oldData, actor = null) {
  if (!oldData) return;

  const changes = [];
  if (oldData.sb_check !== newData.sb_check && newData.sb_check) {
    changes.push(`• Проверка СБ: ${oldData.sb_check || '—'} → ${newData.sb_check}`);
  }
  if (oldData.medical_check !== newData.medical_check && newData.medical_check) {
    changes.push(`• Медкомиссия: ${oldData.medical_check || '—'} → ${newData.medical_check}`);
  }
  if (oldData.payment_basis !== newData.payment_basis && newData.payment_basis) {
    changes.push(`• Основание выплаты: ${oldData.payment_basis || '—'} → ${newData.payment_basis}`);
  }
  if (oldData.payment_made !== newData.payment_made && newData.payment_made) {
    changes.push(`• Выплачено: ${oldData.payment_made || '—'} → ${newData.payment_made}`);
  }

  if (changes.length === 0) return;

  const actorName = actor?.name || 'Администратор';
  const actorRole = actor?.role || '';
  const now = new Date().toLocaleString('ru-RU');
  const message = `Статус обновлён:\n${changes.join('\n')}`;

  try {
    // Создаём in-app уведомление для агентства
    if (newData.agency_id) {
      await base44.entities.Notification.create({
        agency_id: newData.agency_id,
        agency_name: newData.agency_name || '',
        candidate_id: newData.id || '',
        candidate_name: newData.full_name || '',
        message,
        link: '/admin/candidates',
        is_read: false,
        category: 'status',
        actor_name: actorName,
        actor_role: actorRole,
      });

      const agencies = await base44.entities.Agency.filter({ id: newData.agency_id });
      const agency = agencies[0];
      if (agency) {
        const recipientEmails = [agency.email, agency.manager_email].filter(Boolean);
        if (recipientEmails.length > 0) {
          const subject = `Статус обновлён: ${newData.full_name}`;
          const body = `Статус кандидата «${newData.full_name}» обновлён.\n\nАгентство: ${agency.name}\nДолжность: ${newData.position || '—'}\n\nИзменения:\n${changes.join('\n')}\n\nИнициатор: ${actorName}\nДата: ${now}`;
          await Promise.allSettled(recipientEmails.map(email =>
            base44.integrations.Core.SendEmail({ to: email, subject, body, from_name: 'Bratouveriye SNB' })
          ));
        }
      }
    }
  } catch (e) {
    // Silent
  }
}
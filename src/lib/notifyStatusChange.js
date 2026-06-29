import { base44 } from '@/api/base44Client';

/**
 * Отправляет email-уведомление менеджеру агентства при изменении статуса кандидата.
 * Проверяет поля: sb_check, medical_check, payment_basis, payment_made.
 * Уведомления отправляются на email и manager_email агентства.
 * Ошибки тихо игнорируются — уведомления не должны блокировать сохранение.
 */
export async function notifyStatusChange(newData, oldData) {
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

  try {
    const agencyId = newData.agency_id;
    if (!agencyId) return;

    const agencies = await base44.entities.Agency.filter({ id: agencyId });
    const agency = agencies[0];
    if (!agency) return;

    const recipientEmails = [agency.email, agency.manager_email].filter(Boolean);
    if (recipientEmails.length === 0) return;

    const subject = `Статус обновлён: ${newData.full_name}`;
    const body = `Статус кандидата «${newData.full_name}» обновлён.\n\nАгентство: ${agency.name}\nДолжность: ${newData.position || '—'}\n\nИзменения:\n${changes.join('\n')}\n\nДата: ${new Date().toLocaleString('ru-RU')}`;

    const promises = recipientEmails.map(email =>
      base44.integrations.Core.SendEmail({ to: email, subject, body, from_name: 'Bratouveriye SNB' })
    );
    await Promise.allSettled(promises);
  } catch (e) {
    // Тихая ошибка — уведомления не должны блокировать сохранение
  }
}
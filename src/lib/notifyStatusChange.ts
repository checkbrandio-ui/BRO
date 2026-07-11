import { base44 } from '@/api/base44Client';
import type { Candidate, Actor } from './types';

/**
 * Создаёт in-app уведомление и отправляет email при изменении статуса кандидата.
 * Проверяет поля: sb_check, medical_check, payment_basis, payment_made.
 */
export async function notifyStatusChange(
  newData: Candidate,
  oldData: Candidate | null,
  actor: Actor | null = null
): Promise<void> {
  if (!oldData) return;

  const changes: string[] = [];
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

      const agency = await base44.entities.Agency.get(newData.agency_id);
      if (agency) {
        const recipientEmails = [agency.email, agency.manager_email].filter(Boolean) as string[];
        if (recipientEmails.length > 0) {
          const subject = `Статус обновлён: ${newData.full_name}`;
          const body = `Статус кандидата «${newData.full_name}» обновлён.\n\nАгентство: ${agency.name}\nДолжность: ${newData.position || '—'}\n\nИзменения:\n${changes.join('\n')}\n\nИнициатор: ${actorName}\nДата: ${now}`;
          await Promise.allSettled(
            recipientEmails.map((email) =>
              base44.integrations.Core.SendEmail({ to: email, subject, body, from_name: 'БРО-СНБ' })
            )
          );
        }
      }
    }
  } catch {
    // Silent
  }
}
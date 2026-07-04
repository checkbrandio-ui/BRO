import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FIELD_LABELS: Record<string, string> = {
  full_name: 'ФИО',
  position: 'Должность',
  phone: 'Телефон',
  email: 'Email',
  city: 'Город проживания',
  assembly_point: 'Пункт сбора',
  assembly_distance: 'Расстояние до точки сбора',
  sb_check: 'Проверка СБ',
  medical_check: 'Медкомиссия',
  payment_basis: 'Основание выплаты',
  payment_made: 'Выплачено',
  arrival_date: 'Дата прибытия',
  comment: 'Комментарий',
  health_status: 'Состояние здоровья',
  health_details: 'Описание ограничений',
  is_archived: 'Архив',
  form_status: 'Статус анкеты',
  agency_name: 'Агентство',
  citizenship: 'Гражданство',
  birth_place: 'Место рождения',
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { event, data, old_data } = body;

    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    if (!data || event?.type !== 'update') {
      return Response.json({ success: true, skipped: true });
    }

    // Сравниваем старые и новые данные
    const changes: string[] = [];
    if (old_data) {
      for (const [key, label] of Object.entries(FIELD_LABELS)) {
        const oldVal = old_data[key] ?? '';
        const newVal = data[key] ?? '';
        if (String(oldVal) !== String(newVal) && (oldVal || newVal)) {
          changes.push(`• ${label}: ${oldVal || '—'} → ${newVal || '—'}`);
        }
      }
    }

    if (changes.length === 0) {
      return Response.json({ success: true, message: 'No tracked changes' });
    }

    const candidateName = data.full_name || 'Кандидат';
    const agencyId = data.agency_id;
    const candidateEmail = data.email;

    // Получаем информацию об агентстве
    let agencyEmail = '';
    let managerEmail = '';
    let agencyName = data.agency_name || '';
    if (agencyId) {
      try {
        const agencies = await sr.entities.Agency.filter({ id: agencyId });
        if (agencies[0]) {
          agencyEmail = agencies[0].email || '';
          managerEmail = agencies[0].manager_email || '';
          agencyName = agencies[0].name || agencyName;
        }
      } catch (_e) { /* ignore */ }
    }

    // Получаем email администраторов и модераторов
    let adminEmails: string[] = [];
    let moderatorEmails: string[] = [];
    try {
      const admins = await sr.entities.User.filter({ role: 'admin' });
      adminEmails = admins.map((a: any) => a.email).filter(Boolean);
    } catch (_e) { /* ignore */ }
    try {
      const moderators = await sr.entities.User.filter({ role: 'moderator' });
      moderatorEmails = moderators.map((m: any) => m.email).filter(Boolean);
    } catch (_e) { /* ignore */ }

    // Создаём in-app уведомление
    try {
      await sr.entities.Notification.create({
        agency_id: agencyId || '',
        agency_name: agencyName,
        candidate_id: data.id || '',
        candidate_name: candidateName,
        message: changes.join('\n'),
        link: '/admin/candidates',
        is_read: false,
        category: 'card',
      });
    } catch (e) {
      console.error('Notification creation failed:', (e as Error).message);
    }

    // Отправляем email-уведомления
    const subject = `Изменение карточки: ${candidateName}`;
    const emailBody = `Кандидат: ${candidateName}\nАгентство: ${agencyName || '—'}\n\nИзменения:\n${changes.join('\n')}\n\nДата: ${new Date().toLocaleString('ru-RU')}`;

    const allEmails = [
      ...adminEmails,
      ...moderatorEmails,
      agencyEmail,
      managerEmail,
      candidateEmail,
    ].filter(Boolean);

    const emailPromises = allEmails.map((email: string) =>
      sr.integrations.Core.SendEmail({ to: email, subject, body: emailBody, from_name: 'Bratouveriye SNB' })
        .catch(() => {})
    );
    await Promise.allSettled(emailPromises);

    return Response.json({
      success: true,
      changes: changes.length,
      emails_sent: allEmails.length,
      notification_created: true,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
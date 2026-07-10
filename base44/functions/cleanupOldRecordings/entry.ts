import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Очистка старых записей звонков из комментариев кандидатов.
 * Записи старше 30 дней удаляются из поля comment.
 * Запускать по расписанию (например, ежедневно в 03:00).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const candidates = await base44.asServiceRole.entities.Candidate.list('-created_date', 500);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    let cleaned = 0;

    for (const cand of candidates) {
      if (!cand.comment || !cand.comment.includes('[📞 Звонок')) continue;

      const parts = cand.comment.split('\n---\n');
      const kept: string[] = [];
      let removed = false;

      for (const part of parts) {
        if (part.includes('[📞 Звонок')) {
          // Парсим дату из заголовка: "[📞 Звонок | Роль | DD.MM.YYYY, HH:MM:SS]"
          const headerMatch = part.match(/\[📞 Звонок\s*\|\s*[^|]+\|\s*([^\]]+)\]/);
          if (headerMatch) {
            const dateStr = headerMatch[1].trim();
            const [datePart, timePart] = dateStr.split(', ');
            if (datePart) {
              const [day, month, year] = datePart.split('.');
              if (day && month && year) {
                const parsedDate = new Date(`${year}-${month}-${day}T${timePart || '00:00:00'}`);
                if (!isNaN(parsedDate.getTime()) && parsedDate < cutoff) {
                  removed = true;
                  continue; // Пропускаем — удаляем эту запись
                }
              }
            }
          }
        }
        kept.push(part);
      }

      if (removed) {
        const newComment = kept.join('\n---\n').trim();
        await base44.asServiceRole.entities.Candidate.update(cand.id, { comment: newComment });
        cleaned++;
      }
    }

    return Response.json({ status: 'success', cleaned, total_scanned: candidates.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
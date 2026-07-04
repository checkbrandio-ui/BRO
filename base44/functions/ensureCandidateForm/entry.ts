import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Гарантирует наличие записи CandidateForm для кандидата.
 * Вызывается при создании Candidate — создаёт связанную пустую анкету.
 * 
 * Принимает: { candidate_id, form_token }
 * Возвращает: { form_id, already_existed }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const body = await req.json();
    const { candidate_id, form_token } = body;

    if (!candidate_id || !form_token) {
      return Response.json({ error: 'candidate_id and form_token required' }, { status: 400 });
    }

    // Проверяем — может форма уже существует
    const existing = await sr.entities.CandidateForm.filter({ candidate_id });
    if (existing.length > 0) {
      return Response.json({ form_id: existing[0].id, already_existed: true });
    }

    // Создаём новую форму
    const newForm = await sr.entities.CandidateForm.create({
      candidate_id,
      form_token,
      status: 'pending',
    });

    return Response.json({ form_id: newForm.id, already_existed: false });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
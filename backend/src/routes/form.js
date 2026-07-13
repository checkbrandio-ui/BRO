const express = require('express');
const router = express.Router();
const pool = require('../db/client');

// GET /api/form/:token — публичный, без авторизации
router.get('/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const candRes = await pool.query(
      `SELECT c.*, a.name as agency_name, a.access_code as agency_access_code
       FROM candidates c
       LEFT JOIN agencies a ON a.id = c.agency_id
       WHERE c.form_token = $1 AND c.deleted_at IS NULL`,
      [token]
    );
    if (!candRes.rows.length) {
      return res.status(404).json({ data: null, error: 'Анкета не найдена или недействительна' });
    }
    const candidate = candRes.rows[0];

    const formRes = await pool.query(
      `SELECT * FROM candidate_forms WHERE form_token = $1 ORDER BY created_at DESC LIMIT 1`,
      [token]
    );
    let form = formRes.rows[0] || null;

    if (!form) {
      const newForm = await pool.query(
        `INSERT INTO candidate_forms (candidate_id, form_token, status)
         VALUES ($1, $2, 'pending') RETURNING *`,
        [candidate.id, token]
      );
      form = newForm.rows[0];
    }

    res.json({ data: { candidate, form }, error: null });
  } catch (e) {
    console.error('GET /api/form/:token error:', e);
    res.status(500).json({ data: null, error: e.message });
  }
});

// PATCH /api/form/:token — сохранить/отправить анкету (публичный)
router.patch('/:token', async (req, res) => {
  const { token } = req.params;
  const body = req.body;
  try {
    const candRes = await pool.query(
      `SELECT * FROM candidates WHERE form_token = $1 AND deleted_at IS NULL`,
      [token]
    );
    if (!candRes.rows.length) {
      return res.status(404).json({ data: null, error: 'Анкета не найдена' });
    }
    const candidate = candRes.rows[0];

    const formRes = await pool.query(
      `SELECT * FROM candidate_forms WHERE form_token = $1 ORDER BY created_at DESC LIMIT 1`,
      [token]
    );
    let form = formRes.rows[0];

    const formData = body.form_data || body;
    const status = body.status || form?.status || 'pending';
    const submittedAt = status === 'completed' ? new Date() : (form?.submitted_at || null);

    if (form) {
      const updated = await pool.query(
        `UPDATE candidate_forms
         SET form_data = $1, status = $2, submitted_at = $3, updated_at = NOW()
         WHERE form_token = $4 RETURNING *`,
        [JSON.stringify(formData), status, submittedAt, token]
      );
      form = updated.rows[0];
    } else {
      const created = await pool.query(
        `INSERT INTO candidate_forms (candidate_id, form_token, status, form_data, submitted_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [candidate.id, token, status, JSON.stringify(formData), submittedAt]
      );
      form = created.rows[0];
    }

    if (status === 'completed') {
      const allowed = ['full_name','birth_date','birth_place','citizenship','phone','email',
        'city','assembly_point','arrival_date','arrival_time','position','health_status',
        'logistics_status','proposed_assembly_point','proposed_arrival_date','proposed_arrival_time'];
      const fields = [];
      const vals = [];
      let i = 1;
      for (const k of allowed) {
        if (formData[k] !== undefined) { fields.push(`${k} = $${i}`); vals.push(formData[k]); i++; }
      }
      if (fields.length) {
        vals.push(candidate.id);
        await pool.query(`UPDATE candidates SET ${fields.join(', ')}, form_status = 'completed', form_submitted_at = NOW(), updated_at = NOW() WHERE id = $${i}`, vals);
      }
    }

    res.json({ data: { form, candidate_id: candidate.id }, error: null });
  } catch (e) {
    console.error('PATCH /api/form/:token error:', e);
    res.status(500).json({ data: null, error: e.message });
  }
});

module.exports = router;

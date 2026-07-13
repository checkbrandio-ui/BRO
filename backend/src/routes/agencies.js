const router = require('express').Router();
const pool = require('../db/client');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
 try {
 const { rows } = await pool.query(
 'SELECT * FROM agencies WHERE deleted_at IS NULL ORDER BY created_at DESC'
 );
 res.json({ data: rows, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.get('/:id', authenticate, async (req, res) => {
 try {
 const { rows } = await pool.query('SELECT * FROM agencies WHERE id = $1', [req.params.id]);
 if (!rows[0]) return res.status(404).json({ data: null, error: 'Не найдено' });
 res.json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.post('/', authenticate, async (req, res) => {
  try {
    const f = req.body;
    if (!f.name) return res.status(400).json({ data: null, error: 'Название агентства обязательно' });
    // Проверка уникальности кода доступа
    if (f.access_code) {
      const { rows: existing } = await pool.query('SELECT id FROM agencies WHERE access_code = $1 AND deleted_at IS NULL', [f.access_code]);
      if (existing.length > 0) return res.status(409).json({ data: null, error: 'Код доступа уже используется другим агентством' });
    }
    const { rows } = await pool.query(
      `INSERT INTO agencies (name,city,email,phone,status,is_active,access_code,contract_url,contract_date,special_conditions,comment,planned_candidates,manager_email) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [f.name, f.city||null, f.email||null, f.phone||null, f.status||'Рассматривается', f.is_active!==false, f.access_code||null, f.contract_url||null, f.contract_date||null, f.special_conditions||null, f.comment||null, f.planned_candidates||0, f.manager_email||null]
    );
    res.status(201).json({ data: rows[0], error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.put('/:id', authenticate, async (req, res) => {
 try {
 const f = req.body;
 const { rows } = await pool.query(
 `UPDATE agencies SET name=$1,city=$2,email=$3,phone=$4,status=$5,is_active=$6,access_code=$7,contract_url=$8,contract_date=$9,special_conditions=$10,comment=$11,call_datetime=$12,call_type=$13,planned_candidates=$14,manager_email=$15,updated_at=NOW() WHERE id=$16 RETURNING *`,
 [f.name,f.city,f.email,f.phone,f.status,f.is_active,f.access_code,f.contract_url,f.contract_date,f.special_conditions,f.comment,f.call_datetime,f.call_type,f.planned_candidates,f.manager_email,req.params.id]
 );
 res.json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.delete('/:id', authenticate, async (req, res) => {
 try {
 await pool.query('UPDATE agencies SET deleted_at=NOW() WHERE id=$1', [req.params.id]);
 res.json({ data: { success: true }, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// PATCH — частичное обновление (алиас PUT)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const fields = Object.keys(req.body);
    if (!fields.length) return res.status(400).json({ data: null, error: 'Нет данных для обновления' });
    const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const vals = fields.map(f => req.body[f]);
    vals.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE agencies SET ${sets}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ data: null, error: 'Агентство не найдено' });
    res.json({ data: rows[0], error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

module.exports = router;

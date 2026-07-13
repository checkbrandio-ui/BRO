const router = require('express').Router();
const pool = require('../db/client');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Список с фильтрами
router.get('/', authenticate, async (req, res) => {
 try {
 const { agency_id, is_archived, deleted, search, limit = 100, offset = 0 } = req.query;
 let where = [];
 let params = [];
 let i = 1;

 if (is_archived === 'true') { where.push('c.is_archived = true'); }
 else if (is_archived === 'false') { where.push('c.is_archived = false'); }

 if (deleted === 'true') { where.push('c.deleted_at IS NOT NULL'); }
 else { where.push('c.deleted_at IS NULL'); }

 if (agency_id) { where.push('c.agency_id = $' + i++); params.push(agency_id); }
 if (search) {
 where.push('(c.full_name ILIKE $' + i + ' OR c.phone ILIKE $' + i + ')');
 params.push('%' + search + '%'); i++;
 }

 const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
 params.push(Number(limit), Number(offset));

 const { rows } = await pool.query(
 'SELECT c.*, a.name as agency_name_ref FROM candidates c ' +
 'LEFT JOIN agencies a ON c.agency_id = a.id ' +
 whereStr + ' ORDER BY c.created_at DESC LIMIT $' + i + ' OFFSET $' + (i+1),
 params
 );
 res.json({ data: rows, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// Один кандидат
router.get('/:id', authenticate, async (req, res) => {
 try {
 const { rows } = await pool.query(
 'SELECT c.* FROM candidates c WHERE c.id = $1 AND c.deleted_at IS NULL',
 [req.params.id]
 );
 if (!rows[0]) return res.status(404).json({ data: null, error: 'Не найден' });
 res.json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// Создать (с проверкой дублей)
router.post('/', authenticate, async (req, res) => {
 try {
 const f = req.body;

 // Проверка дублей: точное совпадение ФИО + дата рождения
 if (f.full_name && f.birth_date) {
 const { rows: dups } = await pool.query(
 'SELECT id, full_name FROM candidates WHERE birth_date = $1 AND is_archived = false AND deleted_at IS NULL',
 [f.birth_date]
 );
 const normalize = s => s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
 const isDup = dups.some(d => normalize(d.full_name) === normalize(f.full_name));
 if (isDup) return res.status(409).json({ data: null, error: 'Дубликат: кандидат уже существует' });
 }

 const form_token = f.form_token || uuidv4();

 const { rows } = await pool.query(
 `INSERT INTO candidates (
 full_name, position, agency_id, agency_name, phone, email, birth_date, gender,
 citizenship, birth_place, health_status, health_details, city, assembly_point,
 assembly_distance, arrival_date, arrival_time, logistics_status, sb_check,
 medical_check, comment, payment_basis, payment_made, documents, is_archived,
 form_token, form_status, created_by
 ) VALUES (
 $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
 $21,$22,$23,$24,$25,$26,$27,$28
 ) RETURNING *`,
 [
 f.full_name, f.position, f.agency_id, f.agency_name, f.phone, f.email,
 f.birth_date, f.gender||'муж', f.citizenship, f.birth_place,
 f.health_status||'Без замечаний', f.health_details, f.city,
 f.assembly_point, f.assembly_distance, f.arrival_date, f.arrival_time,
 f.logistics_status||'none', f.sb_check||'Не проверялся',
 f.medical_check||'Не проверялся', f.comment, f.payment_basis,
 f.payment_made||'Нет', JSON.stringify(f.documents||[]), false,
 form_token, f.form_status||'not_sent', req.user.id
 ]
 );

 // Автоматически создаём CandidateForm
 await pool.query(
 'INSERT INTO candidate_forms (candidate_id, form_token, status) VALUES ($1, $2, $3) ON CONFLICT (form_token) DO NOTHING',
 [rows[0].id, form_token, 'pending']
 );

 res.status(201).json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// Обновить
router.put('/:id', authenticate, async (req, res) => {
 try {
 const f = req.body;
 const { rows } = await pool.query(
 `UPDATE candidates SET
 full_name=$1, position=$2, agency_id=$3, agency_name=$4, phone=$5, email=$6,
 birth_date=$7, gender=$8, citizenship=$9, birth_place=$10, health_status=$11,
 health_details=$12, city=$13, assembly_point=$14, assembly_distance=$15,
 arrival_date=$16, arrival_time=$17, logistics_status=$18, proposed_assembly_point=$19,
 proposed_arrival_date=$20, proposed_arrival_time=$21, proposed_by=$22,
 logistics_confirmed_at=$23, final_call_confirmed=$24, sb_check=$25,
 medical_check=$26, comment=$27, payment_basis=$28, payment_made=$29,
 documents=$30, is_archived=$31, form_status=$32, updated_at=NOW()
 WHERE id=$33 RETURNING *`,
 [
 f.full_name, f.position, f.agency_id, f.agency_name, f.phone, f.email,
 f.birth_date, f.gender, f.citizenship, f.birth_place, f.health_status,
 f.health_details, f.city, f.assembly_point, f.assembly_distance,
 f.arrival_date, f.arrival_time, f.logistics_status, f.proposed_assembly_point,
 f.proposed_arrival_date, f.proposed_arrival_time, f.proposed_by,
 f.logistics_confirmed_at, f.final_call_confirmed, f.sb_check,
 f.medical_check, f.comment, f.payment_basis, f.payment_made,
 JSON.stringify(f.documents||[]), f.is_archived, f.form_status, req.params.id
 ]
 );
 res.json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// Мягкое удаление
router.delete('/:id', authenticate, async (req, res) => {
 try {
 await pool.query(
 'UPDATE candidates SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
 [req.params.id]
 );
 res.json({ data: { success: true }, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});


// PATCH — частичное обновление кандидата
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const fields = Object.keys(req.body);
    if (!fields.length) return res.status(400).json({ data: null, error: 'Нет данных' });
    const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const vals = [...fields.map(f => req.body[f]), req.params.id];
    const { rows } = await pool.query(
      `UPDATE candidates SET ${sets}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ data: null, error: 'Кандидат не найден' });
    res.json({ data: rows[0], error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

module.exports = router;
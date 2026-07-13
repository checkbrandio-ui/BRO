const router = require('express').Router();
const pool = require('../db/client');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', authenticate, async (req, res) => {
  try {
    const { candidate_id, form_token, status } = req.query;
    let q = 'SELECT * FROM candidate_forms WHERE 1=1';
    const vals = [];
    if (candidate_id) { vals.push(candidate_id); q += ' AND candidate_id = $' + vals.length; }
    if (form_token)   { vals.push(form_token);   q += ' AND form_token = $'  + vals.length; }
    if (status)       { vals.push(status);        q += ' AND status = $'      + vals.length; }
    q += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(q, vals);
    res.json({ data: rows, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { candidate_id, form_token, status = 'pending', uploaded_docs } = req.body;
    const id = uuidv4();
    const token = form_token || uuidv4().replace(/-/g,'').substring(0,16);
    const { rows } = await pool.query(
      'INSERT INTO candidate_forms (id,candidate_id,form_token,status,uploaded_docs,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING *',
      [id, candidate_id, token, status, uploaded_docs ? JSON.stringify(uploaded_docs) : null]
    );
    res.status(201).json({ data: rows[0], error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const fields = Object.keys(req.body);
    if (!fields.length) return res.status(400).json({ data: null, error: 'No data' });
    const sets = fields.map((f, i) => f + ' = $' + (i+1)).join(', ');
    const vals = [...fields.map(f => {
      const v = req.body[f];
      return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
    }), req.params.id];
    const { rows } = await pool.query('UPDATE candidate_forms SET ' + sets + ', updated_at = NOW() WHERE id = $' + (fields.length+1) + ' RETURNING *', vals);
    if (!rows[0]) return res.status(404).json({ data: null, error: 'Not found' });
    res.json({ data: rows[0], error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

router.get('/by-token/:token', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT cf.*, c.full_name, c.phone FROM candidate_forms cf JOIN candidates c ON cf.candidate_id = c.id WHERE cf.form_token = $1',
      [req.params.token]
    );
    if (!rows[0]) return res.status(404).json({ data: null, error: 'Not found' });
    res.json({ data: rows[0], error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

module.exports = router;

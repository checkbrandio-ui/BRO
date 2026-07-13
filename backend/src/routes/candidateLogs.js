const router = require('express').Router();
const pool = require('../db/client');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', authenticate, async (req, res) => {
  try {
    const { candidate_id } = req.query;
    let q = 'SELECT * FROM candidate_logs WHERE 1=1';
    const vals = [];
    if (candidate_id) { vals.push(candidate_id); q += ' AND candidate_id = $' + vals.length; }
    q += ' ORDER BY timestamp DESC LIMIT 500';
    const { rows } = await pool.query(q, vals);
    res.json({ data: rows, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { candidate_id, candidate_name, action, changes, changed_by_id, changed_by_name, changed_by_role, agency_name } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO candidate_logs
        (id, candidate_id, candidate_name, action, changes, changed_by_id, changed_by_name, changed_by_role, agency_name, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *`,
      [uuidv4(), candidate_id, candidate_name||null, action, changes ? JSON.stringify(changes) : '{}',
       changed_by_id||null, changed_by_name||null, changed_by_role||null, agency_name||null]
    );
    res.status(201).json({ data: rows[0], error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

module.exports = router;

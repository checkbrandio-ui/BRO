const router = require('express').Router();
const pool = require('../db/client');
const { authenticate } = require('../middleware/auth');

// GET all crm admins
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, email, full_name, role, is_active, last_login, created_at FROM crm_admins ORDER BY created_at DESC');
    res.json({ data: rows, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// GET one
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, email, full_name, role, is_active, last_login, created_at FROM crm_admins WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ data: null, error: 'Not found' });
    res.json({ data: rows[0], error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// POST create
router.post('/', authenticate, async (req, res) => {
  try {
    const { email, full_name, access_code, role } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO crm_admins (email, full_name, access_code, role) VALUES ($1,$2,$3,$4) RETURNING id, email, full_name, role, is_active',
      [email, full_name, access_code, role || 'manager']
    );
    res.status(201).json({ data: rows[0], error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// PUT update
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { full_name, role, is_active, access_code } = req.body;
    const { rows } = await pool.query(
      'UPDATE crm_admins SET full_name=COALESCE($1,full_name), role=COALESCE($2,role), is_active=COALESCE($3,is_active), access_code=COALESCE($4,access_code), updated_at=NOW() WHERE id=$5 RETURNING id, email, full_name, role, is_active',
      [full_name, role, is_active, access_code, req.params.id]
    );
    res.json({ data: rows[0], error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// DELETE
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('UPDATE crm_admins SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ data: { success: true }, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

module.exports = router;

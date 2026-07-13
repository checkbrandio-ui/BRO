const router = require('express').Router();
const pool = require('../db/client');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
 try {
 const { rows } = await pool.query('SELECT id,email,full_name,role,status,created_at FROM users ORDER BY created_at DESC');
 res.json({ data: rows, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.post('/', authenticate, async (req, res) => {
 try {
 const { email, password, full_name, role } = req.body;
 const hash = await bcrypt.hash(password, 10);
 const { rows } = await pool.query(
 'INSERT INTO users (email,password_hash,full_name,role) VALUES ($1,$2,$3,$4) RETURNING id,email,full_name,role',
 [email,hash,full_name,role||'user']
 );
 res.status(201).json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.put('/:id', authenticate, async (req, res) => {
 try {
 const { full_name, role, status } = req.body;
 const { rows } = await pool.query(
 'UPDATE users SET full_name=$1,role=$2,status=$3,updated_at=NOW() WHERE id=$4 RETURNING id,email,full_name,role,status',
 [full_name,role,status,req.params.id]
 );
 res.json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
module.exports = router;

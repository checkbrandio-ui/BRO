const router = require('express').Router();
const pool = require('../db/client');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
 try {
 const { status } = req.query;
 let where = status ? 'WHERE status = $1' : '';
 const params = status ? [status] : [];
 const { rows } = await pool.query('SELECT * FROM agent_tickets ' + where + ' ORDER BY created_at DESC', params);
 res.json({ data: rows, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.post('/', async (req, res) => {
 try {
 const f = req.body;
 const { rows } = await pool.query(
 'INSERT INTO agent_tickets (asked_by_name,asked_by_role,category,priority,conversation_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
 [f.asked_by_name,f.asked_by_role,f.category,f.priority||'medium',f.conversation_id]
 );
 res.status(201).json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.put('/:id', authenticate, async (req, res) => {
 try {
 const f = req.body;
 const { rows } = await pool.query(
 'UPDATE agent_tickets SET status=$1,answer=$2,answered_by=$3,updated_at=NOW() WHERE id=$4 RETURNING *',
 [f.status,f.answer,f.answered_by||req.user.full_name,req.params.id]
 );
 res.json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
module.exports = router;

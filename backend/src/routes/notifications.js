const router = require('express').Router();
const pool = require('../db/client');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
 try {
 const { agency_name, is_read } = req.query;
 let where = [];
 let params = [];
 let i = 1;
 if (agency_name) { where.push('agency_name = $' + i++); params.push(agency_name); }
 if (is_read !== undefined) { where.push('is_read = $' + i++); params.push(is_read === 'true'); }
 const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
 const { rows } = await pool.query('SELECT * FROM notifications ' + whereStr + ' ORDER BY created_at DESC LIMIT 100', params);
 res.json({ data: rows, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.post('/', authenticate, async (req, res) => {
 try {
 const f = req.body;
 const { rows } = await pool.query(
 'INSERT INTO notifications (agency_name,candidate_id,candidate_name,message,link,is_read,category,actor_name,actor_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
 [f.agency_name,f.candidate_id,f.candidate_name,f.message,f.link,f.is_read||false,f.category,f.actor_name,f.actor_role]
 );
 res.status(201).json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.put('/:id', authenticate, async (req, res) => {
 try {
 const { rows } = await pool.query('UPDATE notifications SET is_read=$1 WHERE id=$2 RETURNING *', [req.body.is_read, req.params.id]);
 res.json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.post('/mark-all-read', authenticate, async (req, res) => {
 try {
 const { agency_name } = req.body;
 await pool.query('UPDATE notifications SET is_read=true WHERE agency_name=$1', [agency_name]);
 res.json({ data: { success: true }, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
module.exports = router;

const router = require('express').Router();
const pool = require('../db/client');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
 try {
 const { rows } = await pool.query('SELECT * FROM assembly_points WHERE is_active=true ORDER BY city ASC');
 res.json({ data: rows, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.post('/', authenticate, async (req, res) => {
 try {
 const f = req.body;
 const { rows } = await pool.query(
 'INSERT INTO assembly_points (city,address,lat,lon,comment) VALUES ($1,$2,$3,$4,$5) RETURNING *',
 [f.city,f.address,f.lat,f.lon,f.comment]
 );
 res.status(201).json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.put('/:id', authenticate, async (req, res) => {
 try {
 const f = req.body;
 const { rows } = await pool.query(
 'UPDATE assembly_points SET city=$1,address=$2,lat=$3,lon=$4,comment=$5,is_active=$6,updated_at=NOW() WHERE id=$7 RETURNING *',
 [f.city,f.address,f.lat,f.lon,f.comment,f.is_active,req.params.id]
 );
 res.json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.delete('/:id', authenticate, async (req, res) => {
 try {
 await pool.query('UPDATE assembly_points SET is_active=false WHERE id=$1', [req.params.id]);
 res.json({ data: { success: true }, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
module.exports = router;

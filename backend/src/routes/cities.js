const router = require('express').Router();
const pool = require('../db/client');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
 try {
 const { search, is_assembly_point } = req.query;
 let where = ['is_active = true'];
 let params = [];
 let i = 1;
 if (search) { where.push('name ILIKE $' + i); params.push('%' + search + '%'); i++; }
 if (is_assembly_point === 'true') { where.push('is_assembly_point = true'); }
 const { rows } = await pool.query('SELECT * FROM cities WHERE ' + where.join(' AND ') + ' ORDER BY name ASC', params);
 res.json({ data: rows, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.post('/', authenticate, async (req, res) => {
 try {
 const f = req.body;
 const { rows } = await pool.query(
 'INSERT INTO cities (name,region,lat,lon,source,is_assembly_point,payment_amount,previous_payment,processing_time,agent_fee,curator_name,curator_phone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
 [f.name,f.region,f.lat,f.lon,f.source||'manual',f.is_assembly_point||false,f.payment_amount,f.previous_payment,f.processing_time,f.agent_fee,f.curator_name,f.curator_phone]
 );
 res.status(201).json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.put('/:id', authenticate, async (req, res) => {
 try {
 const f = req.body;
 const { rows } = await pool.query(
 'UPDATE cities SET name=$1,region=$2,lat=$3,lon=$4,source=$5,is_assembly_point=$6,payment_amount=$7,previous_payment=$8,processing_time=$9,agent_fee=$10,curator_name=$11,curator_phone=$12,is_active=$13,updated_at=NOW() WHERE id=$14 RETURNING *',
 [f.name,f.region,f.lat,f.lon,f.source,f.is_assembly_point,f.payment_amount,f.previous_payment,f.processing_time,f.agent_fee,f.curator_name,f.curator_phone,f.is_active,req.params.id]
 );
 res.json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
router.delete('/:id', authenticate, async (req, res) => {
 try {
 await pool.query('UPDATE cities SET is_active=false WHERE id=$1', [req.params.id]);
 res.json({ data: { success: true }, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});
module.exports = router;

const router = require('express').Router();
const pool = require('../db/client');
const { authenticate } = require('../middleware/auth');

router.post('/find-nearest-city', authenticate, async (req, res) => {
 try {
 const { city_name } = req.body;
 const { rows: cities } = await pool.query(
 'SELECT * FROM cities WHERE is_active=true AND lat IS NOT NULL AND lon IS NOT NULL'
 );
 const target = cities.find(c => c.name.toLowerCase() === city_name?.toLowerCase());
 if (!target) return res.json({ data: { found: false, message: 'Город не найден в справочнике' }, error: null });

 const R = 6371;
 const nearest = cities
 .filter(c => c.is_assembly_point && c.id !== target.id)
 .map(c => {
 const dLat = (c.lat - target.lat) * Math.PI / 180;
 const dLon = (c.lon - target.lon) * Math.PI / 180;
 const a = Math.sin(dLat/2)**2 + Math.cos(target.lat*Math.PI/180)*Math.cos(c.lat*Math.PI/180)*Math.sin(dLon/2)**2;
 const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
 return { ...c, distance_km: Math.round(dist) };
 })
 .sort((a,b) => a.distance_km - b.distance_km);

 res.json({ data: { found: true, target, nearest: nearest.slice(0,3) }, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

router.post('/crm-analytics', authenticate, async (req, res) => {
 try {
 const { period = 'month' } = req.body;
 const now = new Date();
 const start = new Date();
 if (period === 'week') start.setDate(now.getDate()-7);
 else if (period === 'month') start.setMonth(now.getMonth()-1);
 else if (period === 'quarter') start.setMonth(now.getMonth()-3);

 const { rows: candidates } = await pool.query(
 'SELECT c.*, a.name as ag_name FROM candidates c LEFT JOIN agencies a ON c.agency_id=a.id WHERE c.deleted_at IS NULL AND c.created_at >= $1',
 [start]
 );
 const { rows: agencies } = await pool.query('SELECT * FROM agencies WHERE deleted_at IS NULL');

 const byAgency = {};
 agencies.forEach(a => {
 const ac = candidates.filter(c => c.agency_id === a.id);
 byAgency[a.name] = {
 total: ac.length,
 archived: ac.filter(c => c.is_archived).length,
 form_completed: ac.filter(c => c.form_status === 'completed').length,
 };
 });

 res.json({ data: { period, total: candidates.length, by_agency: byAgency }, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});


// ── createCandidateSafe — создание с проверкой дублей ─────────────────────
router.post('/create-candidate-safe', authenticate, async (req, res) => {
  try {
    const d = req.body.candidate_data || req.body;
    // Проверка дубля по ФИО + дата рождения
    if (d.full_name && d.birth_date) {
      const { rows: dups } = await pool.query(
        'SELECT id, full_name, birth_date, agency_name FROM candidates WHERE full_name=$1 AND birth_date=$2 AND deleted_at IS NULL',
        [d.full_name, d.birth_date]
      );
      if (dups.length > 0) {
        return res.json({ data: { error: 'duplicate', existing_candidate: dups[0] }, error: null });
      }
    }
    const { rows } = await pool.query(
      `INSERT INTO candidates (
        full_name, position, agency_id, agency_name, phone, email,
        birth_date, gender, citizenship, birth_place,
        sb_check, medical_check, comment, payment_basis, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        d.full_name, d.position || null, d.agency_id || null, d.agency_name || null,
        d.phone || null, d.email || null, d.birth_date || null,
        d.gender || 'муж', d.citizenship || null, d.birth_place || null,
        d.sb_check || 'Не проверялся', d.medical_check || 'Не проверялся',
        d.comment || null, d.payment_basis || null,
        req.user?.id || null
      ]
    );
    res.status(201).json({ data: { candidate: rows[0], error: null }, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// ── searchCities ───────────────────────────────────────────────────────────
router.post('/search-cities', authenticate, async (req, res) => {
  try {
    const { query } = req.body;
    const { rows } = query && query !== '_all'
      ? await pool.query("SELECT * FROM cities WHERE is_active=true AND name ILIKE $1 ORDER BY name LIMIT 20", [`%${query}%`])
      : await pool.query("SELECT * FROM cities WHERE is_active=true ORDER BY name");
    res.json({ data: rows, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// ── getCityCoordinates ─────────────────────────────────────────────────────
router.post('/get-city-coordinates', authenticate, async (req, res) => {
  try {
    const { city } = req.body;
    const { rows } = await pool.query('SELECT * FROM cities WHERE name ILIKE $1 AND is_active=true LIMIT 1', [city]);
    if (!rows[0]) return res.json({ data: { found: false }, error: null });
    res.json({ data: { found: true, lat: rows[0].lat, lon: rows[0].lon, city: rows[0] }, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// ── getCandidateLogistics ──────────────────────────────────────────────────
router.post('/get-candidate-logistics', authenticate, async (req, res) => {
  try {
    const { candidate_id } = req.body;
    const { rows } = await pool.query('SELECT * FROM candidates WHERE id=$1', [candidate_id]);
    res.json({ data: rows[0] || null, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// ── createTaskNotification ─────────────────────────────────────────────────
router.post('/create-task-notification', authenticate, async (req, res) => {
  try {
    const { title, body, type, candidate_id, agency_id } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO notifications (title, body, type, candidate_id, agency_id, is_read) VALUES ($1,$2,$3,$4,$5,false) RETURNING *',
      [title || 'Уведомление', body || '', type || 'info', candidate_id || null, agency_id || null]
    );
    res.json({ data: rows[0], error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// ── checkCandidateDocuments ────────────────────────────────────────────────
router.post('/check-candidate-documents', authenticate, async (req, res) => {
  try {
    const { candidate_id } = req.body;
    const { rows } = await pool.query('SELECT documents, form_status FROM candidates WHERE id=$1', [candidate_id]);
    const docs = rows[0]?.documents || [];
    res.json({ data: { documents: docs, form_status: rows[0]?.form_status, count: docs.length }, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// ── archiveRefusedCandidates ───────────────────────────────────────────────
router.post('/archive-refused-candidates', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE candidates SET is_archived=true WHERE sb_check='Отказано' AND is_archived=false RETURNING id"
    );
    res.json({ data: { archived_count: rows.length }, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// ── getCandidateEventLog ───────────────────────────────────────────────────
router.post('/get-candidate-event-log', authenticate, async (req, res) => {
  try {
    const { candidate_id } = req.body;
    const { rows } = await pool.query(
      'SELECT * FROM candidate_logs WHERE candidate_id=$1 ORDER BY created_at DESC LIMIT 100',
      [candidate_id]
    );
    res.json({ data: rows, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// ── generateCallScript ─────────────────────────────────────────────────────
router.post('/generate-call-script', authenticate, async (req, res) => {
  try {
    const { candidate_id } = req.body;
    const { rows } = await pool.query('SELECT * FROM candidates WHERE id=$1', [candidate_id]);
    const c = rows[0];
    if (!c) return res.json({ data: { script: 'Кандидат не найден' }, error: null });
    const script = `Здравствуйте, ${c.full_name}!\nЭто звонок от ООО «БРО-СНБ».\nВаша должность: ${c.position || 'не указана'}.\nПросим подтвердить готовность к отправке.`;
    res.json({ data: { script, candidate: c }, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// ── respondToTicket ────────────────────────────────────────────────────────
router.post('/respond-to-ticket', authenticate, async (req, res) => {
  try {
    const { ticket_id, response_text } = req.body;
    const { rows } = await pool.query(
      "UPDATE agent_tickets SET response=$1, status='resolved', answered_by=$2, answered_at=NOW() WHERE id=$3 RETURNING *",
      [response_text, req.user?.full_name || 'Admin', ticket_id]
    );
    res.json({ data: rows[0], error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// ── generateDocument ───────────────────────────────────────────────────────
router.post('/generate-document', authenticate, async (req, res) => {
  try {
    const { candidate_id, document_type } = req.body;
    const { rows } = await pool.query('SELECT * FROM candidates WHERE id=$1', [candidate_id]);
    if (!rows[0]) return res.status(404).json({ data: null, error: 'Кандидат не найден' });
    // Заглушка — возвращаем мета-данные документа
    res.json({ data: { success: true, document_type, candidate_id, url: null }, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

module.exports = router;
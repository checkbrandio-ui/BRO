const router = require('express').Router();
const pool = require('../db/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');

// Логин CRM-менеджера
router.post('/login', async (req, res) => {
 try {
 const { email, password } = req.body;
 const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
 if (!rows[0]) return res.status(401).json({ data: null, error: 'Неверный email или пароль' });
 const valid = await bcrypt.compare(password, rows[0].password_hash);
 if (!valid) return res.status(401).json({ data: null, error: 'Неверный email или пароль' });
 const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '30d' });
 const { password_hash, ...user } = rows[0];
 res.json({ data: { user, token }, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// Текущий пользователь
router.get('/me', authenticate, async (req, res) => {
 const { password_hash, ...user } = req.user;
 res.json({ data: user, error: null });
});

// Вход агентства по access_code
router.post('/agency-login', async (req, res) => {
 try {
 const { access_code } = req.body;
 const { rows } = await pool.query(
 'SELECT * FROM agencies WHERE access_code = $1 AND is_active = true AND deleted_at IS NULL',
 [access_code]
 );
 if (!rows[0]) return res.status(401).json({ data: null, error: 'Неверный код доступа' });
 res.json({ data: { agency: rows[0] }, error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

// Публичный доступ к анкете по form_token (без авторизации)
router.get('/form/:token', async (req, res) => {
 try {
 const { rows } = await pool.query(
 `SELECT cf.*, c.full_name as candidate_full_name, c.phone as candidate_phone
 FROM candidate_forms cf
 JOIN candidates c ON cf.candidate_id = c.id
 WHERE cf.form_token = $1`,
 [req.params.token]
 );
 if (!rows[0]) return res.status(404).json({ data: null, error: 'Анкета не найдена' });
 res.json({ data: rows[0], error: null });
 } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});


// Вход CRM-администратора по секретному коду
router.post('/crm-login', async (req, res) => {
  try {
    const { access_code } = req.body;
    if (!access_code) return res.status(400).json({ data: null, error: 'Код не указан' });
    const { rows } = await pool.query(
      'SELECT id, email, full_name, role, is_active FROM crm_admins WHERE access_code = $1 AND is_active = true',
      [access_code.trim()]
    );
    if (!rows[0]) return res.status(401).json({ data: null, error: 'Неверный код доступа или аккаунт деактивирован' });
    // Обновляем last_login
    await pool.query('UPDATE crm_admins SET last_login = NOW() WHERE id = $1', [rows[0].id]);
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: rows[0].id, role: rows[0].role, type: 'crm_admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ data: { admin: rows[0], token }, error: null });
  } catch (e) { res.status(500).json({ data: null, error: e.message }); }
});

module.exports = router;
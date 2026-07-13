const jwt = require('jsonwebtoken');
const pool = require('../db/client');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ data: null, error: 'Не авторизован' });
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'crm_admin') {
      const result = await pool.query(
        'SELECT id, email, full_name, role FROM crm_admins WHERE id = $1 AND is_active = true',
        [decoded.id]
      );
      if (!result.rows[0]) return res.status(401).json({ data: null, error: 'Администратор не найден' });
      req.user = Object.assign({}, result.rows[0], { user_type: 'crm_admin' });
    } else {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      if (!result.rows[0]) return res.status(401).json({ data: null, error: 'Пользователь не найден' });
      req.user = result.rows[0];
    }
    next();
  } catch (e) {
    return res.status(401).json({ data: null, error: 'Неверный токен' });
  }
};

module.exports = { authenticate };

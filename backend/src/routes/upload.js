const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const uploadDir = '/var/www/backend/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls', '.zip', '.txt'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED.includes(ext)) return cb(null, true);
    // Возвращаем ошибку через cb — multer поймает ниже
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Недопустимый тип: ${ext}. Разрешены: ${ALLOWED.join(', ')}`));
  }
});

router.post('/', authenticate, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const msg = err.message || (err.code === 'LIMIT_FILE_SIZE' ? 'Файл слишком большой (макс 20MB)' : 'Ошибка загрузки');
      return res.status(400).json({ data: null, error: msg });
    }
    if (!req.file) return res.status(400).json({ data: null, error: 'Файл не получен' });
    const file_url = `https://api.bro-crm.ru/files/${req.file.filename}`;
    res.json({ data: { file_url, filename: req.file.originalname, size: req.file.size }, error: null });
  });
});

module.exports = router;

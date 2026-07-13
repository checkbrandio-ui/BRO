const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const allowedOrigins = [
  'https://bro-s52g.vercel.app',
  'https://bro-crm.vercel.app',
  'https://bratouverie-snb.ru',
  'https://www.bratouverie-snb.ru',
  'https://bro-crm.ru',
  'https://www.bro-crm.ru',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://bro-crm.base44.app',
  'https://app.base44.com',
];

const corsOptions = {
  origin: (origin, cb) => {
    // Разрешаем запросы без origin (мобильные приложения, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    // Разрешаем все vercel preview deploys
    if (origin && origin.match(/\.vercel\.app$/)) return cb(null, true);
    // Разрешаем все Base44 домены (включая preview и staging)
    if (origin && origin.match(/\.base44\.app$/)) return cb(null, true);
    if (origin && origin.match(/\.base44-preview\.app$/)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
// Явно обрабатываем preflight OPTIONS для всех роутов
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Статика для загруженных файлов
app.use('/files', express.static('/var/www/backend/uploads'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/agencies', require('./routes/agencies'));
app.use('/api/cities', require('./routes/cities'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/assembly-points', require('./routes/assemblyPoints'));
app.use('/api/candidate-forms', require('./routes/candidateForms'));
app.use('/api/candidate-logs', require('./routes/candidateLogs'));
app.use('/api/crm-admins', require('./routes/crmAdmins'));
app.use('/api/agent-tickets', require('./routes/agentTickets'));
app.use('/api/form', require('./routes/form'));
app.use('/api/fn', require('./functions/index'));

app.get('/health', (req, res) => res.json({
  status: 'ok',
  time: new Date(),
  version: process.env.APP_VERSION || '1016c38',
  uptime_sec: Math.floor(process.uptime()),
  node: process.version,
  env: process.env.NODE_ENV || 'production'
}));

module.exports = app;


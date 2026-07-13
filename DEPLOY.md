# Деплой BRO-CRM

## Структура репозитория

```
/
├── src/          — фронтенд (React + Vite)
├── backend/      — бэкенд (Node.js + Express)
└── DEPLOY.md     — эта инструкция
```

---

## Бэкенд (VPS)

### Требования
- Node.js 18+
- PostgreSQL 16
- PM2

### Установка

```bash
cd /var/www/backend
git clone https://github.com/checkbrandio-ui/BRO.git .
cp backend/ /var/www/backend/
cd /var/www/backend

# Установить зависимости
npm install

# Создать .env из примера
cp .env.example .env
# Заполнить DATABASE_URL и JWT_SECRET

# Запустить через PM2
pm2 start src/server.js --name crm-backend
pm2 save
```

### Nginx
```nginx
server {
    server_name api.bro-crm.ru;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Фронтенд (Vercel)

### Переменные окружения
```
VITE_API_URL=https://api.bro-crm.ru
```

### Настройки Vercel
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `/` (корень репо)

### Вручную
```bash
npm install
npm run build
# Скопировать dist/ в /var/www/frontend/
```

---

## Вход в CRM
- URL: `/crm-login`
- Код доступа: `BRO-ADMIN-2026`

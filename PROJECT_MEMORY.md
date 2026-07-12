# PROJECT_MEMORY — BRO-CRM
### «Мозг проекта» — живой документ сессий, решений и опыта

> **⚠️ ОБЯЗАТЕЛЬНО для ИИ-агента:**
> Читай этот файл ПЕРВЫМ перед любыми действиями.
> Обновляй В КОНЦЕ каждой сессии.
> ❌ НЕ ХРАНИТЬ пароли, IP, секретные коды в этом файле — репо публично!
> Все секреты хранить в `.env` на сервере и в Vercel Dashboard.

---

## ПРОЕКТ

CRM для управления кадровым потоком: **агентства → кандидаты → логистика → выплаты**.
Изначально на Base44 платформе, полностью мигрирован на собственный VPS + PostgreSQL.

---

## ИНФРАСТРУКТУРА (без секретов)

| Параметр | Где найти |
|----------|-----------|
| VPS SSH | спросить у владельца в начале сессии |
| DB credentials | `/var/www/backend/.env` на VPS |
| CRM admin code | `/var/www/backend/.env` → `INITIAL_ADMIN_CODE` |
| API | https://api.bro-crm.ru |
| Frontend | https://bro-s52g.vercel.app |
| Git repo | github.com/checkbrandio-ui/BRO (**private**) |

**Стек:** React + Vite + Tailwind (Vercel) | Node.js 20 + Express + PM2 (VPS) | PostgreSQL 16 | Nginx + SSL

---

## СТРУКТУРА БЭКЕНДА

```
/var/www/backend/src/
├── app.js                  # Express + все роуты
├── middleware/auth.js      # JWT — проверяет crm_admins И users
└── routes/
    ├── auth.js             # /api/auth/{crm-login,agency-login,me}
    ├── candidates.js       # CRUD; ?deleted=true → корзина
    ├── agencies.js         # CRUD + проверка дубля access_code
    ├── cities.js           # CRUD + is_assembly_point
    ├── candidateForms.js
    ├── candidateLogs.js
    ├── notifications.js
    ├── crmAdmins.js
    ├── agentTickets.js
    ├── assemblyPoints.js
    ├── users.js
    ├── upload.js           # Multer, /api/upload
    └── form.js             # Публичная форма /api/form/:token
```

---

## СТРУКТУРА ФРОНТА

```
src/
├── api/
│   └── base44Client.js     # ЕДИНСТВЕННЫЙ API клиент
│                           # export default base44 (legacy SDK shim)
│                           # export { apiClient } (новый — использовать в новом коде)
├── components/admin/       # CandidateModal, AgencyModal и др.
├── pages/admin/            # Все CRM страницы
├── pages/AgencyWorkspace.jsx
├── pages/CandidateOnboarding.jsx
└── AuthContext.jsx
```

---

## КАК ДОБАВЛЯТЬ НОВЫЙ КОД

### Запросы к API — только через apiClient:
```js
import { apiClient } from '@/api/base44Client';

// GET
const data = await apiClient.get('/api/candidates?limit=100');

// POST
const created = await apiClient.post('/api/candidates', { full_name: 'Иван' });

// PATCH
await apiClient.patch(`/api/candidates/${id}`, { status: 'active' });

// DELETE
await apiClient.delete(`/api/candidates/${id}`);
```

### Загрузка данных — всегда с try/catch/finally:
```js
const [loading, setLoading] = useState(true);

useEffect(() => {
  (async () => {
    try {
      const data = await apiClient.get('/api/candidates');
      setCandidates(data || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Ошибка загрузки', variant: 'destructive' });
    } finally {
      setLoading(false); // ВСЕГДА — иначе вечный лоадер
    }
  })();
}, []);
```

### ❌ НИКОГДА не делать:
```js
// Не дублировать — это уже в base44Client.js
const API = import.meta.env.VITE_API_URL || '...';
const authH = () => ({ Authorization: `Bearer ${...}` });

// Не использовать голый fetch без try/catch
const res = await fetch(`${API}/api/...`); // → вечный лоадер при ошибке
```

---

## АРХИТЕКТУРА АУТЕНТИФИКАЦИИ

| Тип | Endpoint | Storage |
|-----|----------|---------|
| CRM Admin | POST /api/auth/crm-login | `localStorage['base44_access_token']` (JWT) |
| Агентство | POST /api/auth/agency-login | `sessionStorage['agency_session']` |
| Публичная форма | URL-токен | Без аутентификации |

Middleware проверяет **обе таблицы**: `crm_admins` + `users`.

---

## WORKFLOW РАЗРАБОТКИ

```bash
# 1. Смотрим текущее состояние
bash smoke_test.sh

# 2. Вносим изменения (ТОЛЬКО полная перезапись файлов, не sed-патчи)

# 3. Проверяем сборку
npm run build

# 4. Пушим (pre-push хук заблокирует если build сломан)
git push origin main

# 5. После изменений бэкенда — перезапускаем PM2
pm2 restart crm-backend
```

---

## ЧАСТЫЕ ЛОВУШКИ

| Проблема | Решение |
|----------|---------|
| Вечный лоадер | `setLoading(false)` в `finally`, не в `try` |
| Тихая ошибка в submit | `try/catch` + показать в UI |
| Safari автозаполнение | `useRef` вместо controlled input в логин-формах |
| CHECK constraints PostgreSQL | Снять через `ALTER TABLE DROP CONSTRAINT` |
| pm2 старый код | `pm2 restart crm-backend` после изменений |
| Token key mismatch | Везде строго `base44_access_token` |
| WebSocket/subscribe | Заменить на no-op — недоступен вне Base44 |
| CORS при новом домене | Добавить в `allowedOrigins` в `app.js` |

---

## ХРОНОЛОГИЯ

| Дата | Что сделано |
|------|------------|
| нач. июля 2026 | VPS, PostgreSQL, начальная схема |
| сер. июля 2026 | Express backend, JWT auth, все роуты |
| 13 июля 2026 | Миграция фронта с @base44/sdk на REST |
| 13 июля 2026 | pre-push hook, smoke_test.sh, ARCH_CONTRACT.md |
| 13 июля 2026 | Фикс агентств: CHECK constraints, try/catch |
| 13 июля 2026 | Staging окружение (порт 3001, appdb_staging) |
| 13 июля 2026 | **Все admin страницы → REST** (убраны base44.entities везде) |
| 13 июля 2026 | **Централизация API** — убрано 9x дублирование authH/API, export apiClient |
| 13 июля 2026 | **Безопасность** — секреты убраны из PROJECT_MEMORY, репо → private |

---

## ТЕКУЩЕЕ СОСТОЯНИЕ

### ✅ Работает
- CRM логин и весь CRM интерфейс
- Список, создание, редактирование кандидатов
- Список, создание агентств
- Все 13 REST роутов на бэкенде
- SPA роутинг Vercel
- pre-push hook (блокирует сломанный код)
- Централизованный apiClient

### 🟡 Требует проверки
- Загрузка файлов в UI агентства (`/api/upload`)
- Логин агентства end-to-end
- Публичная форма `/form/:token`
- AgencyWorkspace.jsx — ещё содержит base44.entities (14 вызовов)

### ❌ Удалено
- `@base44/sdk` — полностью удалён
- WebSocket realtime — заменён на no-op

---

## СЛЕДУЮЩИЕ ПРИОРИТЕТЫ

1. **AgencyWorkspace.jsx** — мигрировать 14 вызовов base44.entities на REST
2. **Toast при ошибках загрузки** — сейчас пустой список без объяснений
3. **Upload** — проверить end-to-end в UI
4. **Форма кандидата** — проверить `/form/:token` end-to-end

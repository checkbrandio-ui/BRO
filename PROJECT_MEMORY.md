# PROJECT_MEMORY — BRO-CRM
### «Мозг проекта» — живой документ сессий, решений и опыта

> **⚠️ ОБЯЗАТЕЛЬНО для ИИ-агента:**
> Читай этот файл ПЕРВЫМ перед любыми действиями.
> Обновляй ПОСЛЕ каждого изменения кода.
> ❌ НЕ ХРАНИТЬ пароли, IP, секретные коды в этом файле — репо приватное, но правило остаётся.
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
| Frontend | https://bro-ten-livid.vercel.app |
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
│                           # export { apiClient } — использовать ВЕЗДЕ
│                           # export { base44 } — legacy shim, НЕ использовать
├── components/admin/       # CandidateModal, AgencyModal и др.
├── pages/admin/            # Все CRM страницы
├── pages/AgencyWorkspace.jsx
├── pages/CandidateOnboarding.jsx
└── lib/
    ├── crmSession.ts       # localStorage: crm_admin_session + base44_access_token
    └── AuthContext.jsx
```

---

## КАК ДОБАВЛЯТЬ НОВЫЙ КОД

### Запросы к API — только через apiClient:
```js
import { apiClient } from '@/api/base44Client';

// GET — возвращает массив или объект напрямую (НЕ { data: [...] })
const items = await apiClient.get('/api/candidates?limit=100');

// POST
const created = await apiClient.post('/api/candidates', { full_name: 'Иван' });

// PATCH
await apiClient.patch(`/api/candidates/${id}`, { status: 'active' });

// DELETE
await apiClient.delete(`/api/candidates/${id}`);
```

### ⚠️ КРИТИЧЕСКИЕ ЛОВУШКИ apiClient:
```js
// ❌ НЕЛЬЗЯ — apiClient уже распаковывает data
const res = await apiClient.get('/api/candidates');
res.data  // undefined — нет такого поля!
res.json() // TypeError — это не Response

// ❌ НЕЛЬЗЯ — .catch с объектом вместо []
apiClient.get('/api/agencies').catch(() => ({ data: [] }))  // падает на .forEach

// ✅ ПРАВИЛЬНО
apiClient.get('/api/agencies').catch(() => [])

// ✅ ПРАВИЛЬНО с защитой типа
const result = await apiClient.get('/api/agencies').catch(() => []);
const items = Array.isArray(result) ? result : [];
```

### Загрузка данных — всегда с try/catch/finally:
```js
const [loading, setLoading] = useState(true);

useEffect(() => {
  (async () => {
    try {
      const data = await apiClient.get('/api/candidates');
      setCandidates(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Ошибка загрузки', variant: 'destructive' });
    } finally {
      setLoading(false); // ВСЕГДА в finally — иначе вечный лоадер
    }
  })();
}, []);
```

### ❌ НИКОГДА не делать:
```js
// Не использовать legacy SDK
import { Agency } from '@/api/base44Client';
Agency.list(); // ← НЕТ. Только apiClient.get('/api/agencies')

// Не использовать base44.entities.*
base44.entities.Notification.filter(...) // ← НЕТ

// Не использовать base44.entities.*.subscribe()
base44.entities.Candidate.subscribe(() => ...) // ← НЕТ, WebSocket недоступен
```

---

## АРХИТЕКТУРА АУТЕНТИФИКАЦИИ

| Тип | Endpoint | Storage |
|-----|----------|---------|
| CRM Admin | POST /api/auth/crm-login | `localStorage['base44_access_token']` (JWT) + `localStorage['crm_admin_session']` (профиль) |
| Агентство | POST /api/auth/agency-login | `sessionStorage['agency_session']` (только id + name) |
| Публичная форма | URL-токен | Без аутентификации |

**Важно:** `clearCrmSession()` удаляет ОБА ключа: `crm_admin_session` и `base44_access_token`.
Middleware проверяет **обе таблицы**: `crm_admins` + `users`.

---

## АРХИТЕКТУРА РОУТИНГА (App.jsx)

```
App.jsx
├── <Router>
│   ├── Публичные маршруты (/, /login, /crm-login и др.)
│   ├── <CrmProtectedRoute>  ← проверяет isCrmAuthenticated()
│   │   └── <CrmLayout>      ← монтирует NotificationBell + CrmUserBadge + AssistantWidget
│   │       └── /admin/* маршруты
│   └── <CrmSuperAdminRoute>
│       └── <CrmLayout>
│           └── /admin/crm-admins
└── <Toaster>
```

**Правило:** NotificationBell, CrmUserBadge, AssistantWidget монтируются ТОЛЬКО внутри CrmLayout.
Не выносить их на верхний уровень App — иначе они делают API-запросы на /crm-login.

---

## WORKFLOW РАЗРАБОТКИ

```bash
# 1. Смотрим текущее состояние
bash /var/www/frontend/smoke_test.sh

# 2. Вносим изменения (полная перезапись файлов через API GitHub)

# 3. Push триггерит автодеплой Vercel через GitHub webhook

# 4. После изменений бэкенда — перезапускаем PM2
pm2 restart crm-backend
```

**Если Vercel не подхватил новый коммит:** создать пустой коммит через GitHub API с новым tree SHA — это триггернёт webhook.

---

## ЧАСТЫЕ ЛОВУШКИ

| Проблема | Решение |
|----------|---------|
| Вечный лоадер | `setLoading(false)` в `finally`, не в `try` |
| `forEach is not a function` | `.catch(() => [])` + `Array.isArray()` проверка |
| `undefined` вместо данных | Не делать `.data` после apiClient — он уже распаковал |
| `TypeError: r.json is not a function` | Убрать `.then(r => r.json())` — apiClient не fetch |
| Safari автозаполнение | `useRef` вместо controlled input в логин-формах |
| CHECK constraints PostgreSQL | Снять через `ALTER TABLE DROP CONSTRAINT` |
| pm2 старый код | `pm2 restart crm-backend` после изменений |
| WebSocket/subscribe | Заменить на polling (setInterval 30сек) |
| CORS при новом домене | Добавить в `allowedOrigins` в `app.js` |
| Виджеты на /crm-login | NotificationBell и др. — только в CrmLayout |
| Stale JWT после logout | `clearCrmSession()` чистит оба ключа |
| Template literals | Переменные в строках — только бэктики (`), не кавычки |

---

## ХРОНОЛОГИЯ

| Дата | Что сделано |
|------|------------|
| нач. июля 2026 | VPS, PostgreSQL, начальная схема |
| сер. июля 2026 | Express backend, JWT auth, все роуты |
| 13 июля 2026 | Миграция фронта с @base44/sdk на REST apiClient |
| 13 июля 2026 | pre-push hook, smoke_test.sh, ARCH_CONTRACT.md |
| 13 июля 2026 | Пакет А — lib-нотификаторы (4 файла) на apiClient |
| 13 июля 2026 | Пакет Б — Agencies.jsx на apiClient |
| 13 июля 2026 | Пакет В — AgencyWorkspace.jsx на apiClient |
| 13 июля 2026 | Хотфикс — NotificationBell, AgencyNotificationBell, AgencyNotifications |
| 13 июля 2026 | Массовая миграция: Candidates, CandidateModal, Notifications, AssemblyPoints, CandidateLogs, CrmAdmins, Tickets, Trash, Users |
| 13 июля 2026 | Фикс backtick template literals в 6 файлах |
| 13 июля 2026 | Фикс `.data` unwrapping в 5 файлах (apiClient возвращает данные напрямую) |
| 13 июля 2026 | `clearCrmSession()` — очистка JWT-токена при logout |
| 13 июля 2026 | `NotificationBell` — mountedRef guard, 500мс delay, правильный cleanup |
| 13 июля 2026 | `Candidates.jsx` — `.catch(() => [])` + `Array.isArray()` guard |
| 13 июля 2026 | `App.jsx` — CrmLayout: виджеты монтируются только внутри защищённых роутов |

---

## ТЕКУЩЕЕ СОСТОЯНИЕ

### 🟡 Production (bro-ten-livid.vercel.app) — SHA: 3c2ab00433
> Задеплоен коммит от 13.07 00:47.
> Коммиты после (CrmLayout, Candidates fix, NotificationBell, clearCrmSession) — в GitHub, но НЕ в production.
> Причина: лимит Vercel API 100 деплоев/24ч исчерпан, сброс в ~00:44 14.07.2026.
> **Нужно задеплоить после сброса лимита.**

### ✅ Полностью мигрированы на apiClient
| Файл | Дата |
|------|------|
| `src/pages/admin/Candidates.jsx` | 13.07 |
| `src/pages/admin/CrmAdmins.jsx` | 13.07 |
| `src/pages/admin/CandidateLogs.jsx` | 13.07 |
| `src/pages/admin/Notifications.jsx` | 13.07 |
| `src/pages/admin/AssemblyPoints.jsx` | 13.07 |
| `src/pages/admin/Tickets.jsx` | 13.07 |
| `src/pages/admin/Trash.jsx` | 13.07 |
| `src/pages/admin/Users.jsx` | 13.07 |
| `src/pages/admin/Agencies.jsx` | 13.07 |
| `src/pages/AgencyWorkspace.jsx` | 13.07 |
| `src/pages/AgencyNotifications.jsx` | 13.07 |
| `src/pages/CrmLogin.jsx` | 13.07 |
| `src/pages/AgencyLogin.jsx` | 13.07 |
| `src/components/admin/CandidateModal.jsx` | 13.07 |
| `src/components/admin/NotificationBell.jsx` | 13.07 |
| `src/components/admin/AgencyNotificationBell.jsx` | 13.07 |
| `src/lib/crmSession.ts` | 13.07 |
| `src/App.jsx` | 13.07 |

### 🔴 Ещё содержат legacy (base44.entities / base44.auth)
| Файл | Что именно |
|------|-----------|
| `src/components/admin/AssistantWidget.jsx` | `base44.auth.isAuthenticated()`, `base44.auth.me()` |
| `src/components/admin/DispatchDashboard.jsx` | legacy функции |
| `src/components/admin/FormLinkModal.jsx` | legacy entities |
| `src/components/admin/InlineCommentCell.jsx` | legacy entities |
| `src/components/admin/LogisticsHistory.jsx` | legacy entities |
| `src/components/admin/GeneratedDocumentsSection.jsx` | legacy entities |
| `src/components/admin/RegenerateLinkButton.jsx` | legacy entities |
| `src/components/admin/CandidateFormView.jsx` | legacy entities |
| `src/components/admin/CityEditModal.jsx` | legacy entities |
| `src/components/admin/AddCityModal.jsx` | legacy entities |
| `src/components/CitySelect.jsx` | legacy entities |
| `src/pages/admin/DocumentGenerator.jsx` | legacy entities |

### 🟡 Требует проверки (end-to-end)
- Загрузка файлов в UI агентства (`/api/upload`)
- Логин агентства (`/agency-login` → `/agency/workspace`)
- Публичная форма `/form/:token`

---

## СЛЕДУЮЩИЕ ПРИОРИТЕТЫ

1. **Дождаться сброса лимита Vercel** (~00:44 14.07) → задеплоить HEAD
2. **Проверить вход в CRM** — убедиться что CrmLayout решил проблему виджетов
3. **AssistantWidget.jsx** — убрать `base44.auth.*`, заменить на `isCrmAuthenticated()`
4. **Остальные компоненты** — по таблице 🔴 выше, сверху вниз


# PROJECT_MEMORY — BRO-CRM
### «Мозг проекта» — живой документ сессий, решений и опыта

> **⚠️ ОБЯЗАТЕЛЬНО для ИИ-агента:**
> Читай этот файл ПЕРВЫМ перед любыми действиями.
> Обновляй В КОНЦЕ каждой сессии.
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
│                           # export default base44 (legacy SDK shim — только для обратной совместимости)
│                           # export { apiClient } (новый — использовать ВЕЗДЕ в новом коде)
├── components/admin/       # CandidateModal, AgencyModal и др.
├── pages/admin/            # Все CRM страницы
├── pages/AgencyWorkspace.jsx
├── pages/CandidateOnboarding.jsx
└── lib/AuthContext.jsx
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

// Не использовать legacy SDK напрямую
import { Agency } from '@/api/base44Client';
Agency.list(); // ← НЕТ. Использовать apiClient.get('/api/agencies')
```

---

## АРХИТЕКТУРА АУТЕНТИФИКАЦИИ

| Тип | Endpoint | Storage |
|-----|----------|---------|
| CRM Admin | POST /api/auth/crm-login | `localStorage['base44_access_token']` (JWT) + `localStorage['crm_admin_session']` (профиль) |
| Агентство | POST /api/auth/agency-login | `sessionStorage['agency_session']` (только id + name, без access_code) |
| Публичная форма | URL-токен | Без аутентификации |

Middleware проверяет **обе таблицы**: `crm_admins` + `users`.

> ⚠️ `crmSession.ts` использует `localStorage` (не sessionStorage) — это намеренно: сессия CRM-админа должна переживать перезагрузку страницы.

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
| apiClient возвращает данные | НЕ делать `.then(r => r.json())` — apiClient уже парсит JSON |
| access_code в sessionStorage | Хранить только `{id, name}` — код не класть в браузер |

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
| 13 июля 2026 | **Все admin страницы → REST** (убраны base44.entities из Candidates, CrmAdmins, CandidateLogs) |
| 13 июля 2026 | **Централизация API** — убрано 9x дублирование authH/API, export apiClient |
| 13 июля 2026 | **Безопасность** — секреты убраны из PROJECT_MEMORY, репо → private |
| 13 июля 2026 | **Документация** — PROJECT_MEMORY и ARCH_CONTRACT приведены в соответствие с реальным кодом |
| 13 июля 2026 | **DEVELOPMENT_APPROACH.md** — создан документ подхода к разработке |
| 13 июля 2026 | **Пакет А** — мигрированы 4 lib-нотификатора на apiClient (notifyLogisticsChange, notifyStatusChange, notifyFinalCallConfirmed, candidateLogger) |

---

## ТЕКУЩЕЕ СОСТОЯНИЕ

### ✅ Полностью на REST (apiClient)
- `src/pages/admin/Candidates.jsx`
- `src/pages/admin/CrmAdmins.jsx`
- `src/pages/admin/CandidateLogs.jsx`
- `src/pages/CrmLogin.jsx`
- `src/pages/AgencyLogin.jsx`
- `src/lib/crmSession.ts`
- `src/lib/AuthContext.jsx`
- `src/components/CrmProtectedRoute.jsx`
- `src/components/admin/CandidateModal.jsx` (частично — есть bare fetch, требует чистки)

### 🟡 Требует миграции на apiClient (приоритет по порядку)
| Файл | Проблема |
|------|---------|
| `src/pages/admin/Agencies.jsx` | `base44.entities.*` — весь CRUD через legacy |
| `src/pages/AgencyWorkspace.jsx` | 14 вызовов `base44.entities` |
| `src/pages/AgencyNotifications.jsx` | legacy entities |
| `src/components/admin/NotificationBell.jsx` | legacy subscribe |
| `src/components/admin/DispatchDashboard.jsx` | legacy функции |
| `src/components/admin/FormLinkModal.jsx` | legacy entities |
| `src/components/admin/InlineCommentCell.jsx` | legacy entities |
| `src/components/admin/LogisticsHistory.jsx` | legacy entities |
| `src/components/admin/GeneratedDocumentsSection.jsx` | legacy entities |
| `src/components/admin/RegenerateLinkButton.jsx` | legacy entities |
| `src/components/admin/CandidateFormView.jsx` | legacy entities |
| `src/components/admin/CityEditModal.jsx` | legacy entities |
| `src/components/admin/AddCityModal.jsx` | legacy entities |
| `src/components/admin/AgencyNotificationBell.jsx` | legacy entities |
| `src/components/CitySelect.jsx` | legacy entities |
| `src/lib/candidateLogger.ts` | legacy Notification.create |
| `src/lib/notifyLogisticsChange.ts` | legacy Notification.create |
| `src/lib/notifyStatusChange.ts` | legacy Notification.create |
| `src/lib/notifyFinalCallConfirmed.ts` | legacy Notification.create |
| `src/pages/admin/DocumentGenerator.jsx` | legacy entities |

### 🟡 Требует проверки (end-to-end)
- Загрузка файлов в UI агентства (`/api/upload`)
- Логин агентства (`/agency-login` → `/agency/workspace`)
- Публичная форма `/form/:token`

### ❌ Удалено / отключено
- `@base44/sdk` — полностью удалён
- WebSocket realtime — заменён на no-op (polling где нужно)
- Base44 functions (base44/functions/) — устаревший слой, не используется фронтом

---

## СЛЕДУЮЩИЕ ПРИОРИТЕТЫ

1. **`src/pages/admin/Agencies.jsx`** — мигрировать с `Agency.list()` на `apiClient`
2. **`src/pages/AgencyWorkspace.jsx`** — мигрировать 14 вызовов `base44.entities`
3. **lib-нотификаторы** — `notifyLogisticsChange`, `notifyStatusChange`, `notifyFinalCallConfirmed`, `candidateLogger` → `apiClient.post('/api/notifications', ...)`
4. **Остальные компоненты** — по таблице выше, сверху вниз
5. **Toast при ошибках загрузки** — пустой список без объяснений
6. **Проверить end-to-end** — upload, agency login, форма кандидата

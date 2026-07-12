> **ПЕРВЫМ делом читай PROJECT_MEMORY.md — там вся история проекта и статус миграции.**

# ARCH_CONTRACT — BRO-CRM

> Последнее обновление: 2026-07-13
> Читать ПЕРЕД любым изменением кода.

---

## Стек

| Слой       | Технология                        |
|------------|-----------------------------------|
| Frontend   | React + Vite, Vercel              |
| Backend    | Node.js / Express, PM2 на VPS     |
| Database   | PostgreSQL 16 (appdb / appuser)   |
| API домен  | https://api.bro-crm.ru            |
| Frontend   | https://bro-s52g.vercel.app       |
| VPS        | 193.200.74.125 (root)             |
| Backend dir| /var/www/backend                  |

---

## Аутентификация (три уровня)

| Роль              | Метод         | Хранение              |
|-------------------|---------------|-----------------------|
| CRM-администратор | JWT Bearer    | `localStorage['base44_access_token']` (JWT) + `localStorage['crm_admin_session']` (профиль) |
| Агентство         | access_code   | `sessionStorage['agency_session']` — только `{id, name}`, БЕЗ access_code |
| Публичная форма   | form_token    | URL параметр          |

**Middleware:** проверяет `Authorization: Bearer <jwt>`, валидирует по таблицам `crm_admins` и `users`.

> ⚠️ `crmSession.ts` использует `localStorage` (намеренно — сессия CRM должна жить после перезагрузки).
> `agency_session` — только `sessionStorage` (сбрасывается при закрытии вкладки).

---

## API эндпоинты (все через /api/)

```
POST   /api/auth/crm-login          → { data: { admin, token } }
POST   /api/auth/agency-login       → { data: { agency } }   ← без JWT, только agency object

GET    /api/candidates              ← Bearer
POST   /api/candidates              ← Bearer
PATCH  /api/candidates/:id          ← Bearer
DELETE /api/candidates/:id          ← Bearer

GET    /api/agencies                ← Bearer
POST   /api/agencies                ← Bearer
PATCH  /api/agencies/:id            ← Bearer
DELETE /api/agencies/:id            ← Bearer

GET    /api/cities                  ← публичный
GET    /api/cities/search?q=        ← публичный

GET    /api/users                   ← Bearer
GET    /api/crm-admins              ← Bearer
POST   /api/crm-admins              ← Bearer (super_admin only)

GET    /api/notifications           ← Bearer
POST   /api/notifications           ← Bearer
PATCH  /api/notifications/:id       ← Bearer

GET    /api/assembly-points         ← Bearer

POST   /api/upload                  ← Bearer, multipart/form-data
                                    → { data: { file_url } }

GET    /api/candidate-forms         ← Bearer
POST   /api/candidate-forms         ← Bearer
PATCH  /api/candidate-forms/:id     ← Bearer

GET    /api/candidate-logs          ← Bearer
POST   /api/candidate-logs          ← Bearer

GET    /api/agent-tickets           ← Bearer
POST   /api/agent-tickets           ← Bearer
PATCH  /api/agent-tickets/:id       ← Bearer

GET    /api/form/:token             ← публичный (без Bearer)
POST   /api/form/:token             ← публичный (без Bearer)

POST   /api/fn/:name                ← Bearer (функции)
```

---

## Правила разработки

### Frontend
1. **Полная перезапись файла** — никогда не патчить через `sed` частично.
   Всегда читать файл целиком (`cat`), редактировать, записывать целиком.
2. **Единственный API-клиент** — только `import { apiClient } from '@/api/base44Client'`.
   Никаких `fetch()` напрямую, никаких локальных `const _h = () => ...`, никаких `base44.entities.*`.
3. **Токен** — хранится в `localStorage` под ключом `base44_access_token`. Нигде больше.
4. **API_URL** — только через `import.meta.env.VITE_API_URL || 'https://api.bro-crm.ru'` — и только внутри `base44Client.js`.
5. **Ошибки** — каждый `onSave` / `handleSubmit` обёрнут в `try/catch`, ошибка показывается в UI (не `alert`, не только `console.error`).
6. **Лоадер** — `setLoading(false)` строго в `finally`, не в `try`.
7. **Состояния** — все `useState` объявлены в теле компонента, не в JSX.
8. **Сборка** — `npm run build` перед каждым `git push`. Pre-push хук блокирует сломанный код.
9. **apiClient уже парсит JSON** — не делать `.then(r => r.json())` поверх ответа apiClient.

### Backend
1. Все роуты в `/var/www/backend/src/routes/`.
2. Каждый роут: `try/catch` → `res.status(500).json({ data: null, error: e.message })`.
3. Формат ответа: всегда `{ data: ... }` для успеха, `{ data: null, error: '...' }` для ошибки.
4. PATCH — динамический UPDATE по переданным полям (не перезаписывать всё).
5. При ошибке валидации — `400`, при дубле — `409`, при не найдено — `404`.
6. После изменений на VPS: `pm2 restart crm-backend`.

### Деплой
1. `git push` → Vercel автоматически деплоит frontend.
2. Backend изменения — напрямую по SSH на VPS, перезапуск PM2.
3. После деплоя — запустить `bash smoke_test.sh` (12 проверок за 15 сек).
4. Говорить «готово» только после прохождения smoke_test.sh.

---

## Сущности БД (таблицы)

| Таблица          | Ключевые поля                                      |
|------------------|----------------------------------------------------|
| crm_admins       | id, email, full_name, role, access_code, is_active |
| agencies         | id, name, city, access_code(unique), is_active     |
| candidates       | id, full_name, birth_date, phone, agency_id, deleted_at |
| cities           | id, name, lat, lon, is_assembly_point              |
| users            | id, email, full_name, role                         |
| notifications    | id, type, message, is_read, created_at             |
| assembly_points  | id, name, city, lat, lon                           |
| candidate_forms  | id, candidate_id, form_token, status, uploaded_docs |
| candidate_logs   | id, candidate_id, action, actor_name, created_at  |
| agent_tickets    | id, title, status, created_by                     |

---

## Что НЕЛЬЗЯ делать

- ❌ Использовать `@base44/sdk` — удалён, заменён на `src/api/base44Client.js`
- ❌ Хранить секреты в коде — только в `.env` на VPS
- ❌ Делать `git push` без прохождения pre-push хука
- ❌ Говорить «готово» без проверки — сначала `smoke_test.sh`
- ❌ Патчить JSX через `sed` — только полная перезапись файла
- ❌ Дублировать `const API = ...` и `const authH = ...` — они в `base44Client.js`
- ❌ Использовать `base44.entities.*` напрямую — только `apiClient`
- ❌ Хранить `access_code` агентства в браузере — только `{id, name}` в sessionStorage
- ❌ Делать `.json()` на результате `apiClient` — он уже возвращает данные

---

## Пример правильного компонента

```jsx
import { useState, useEffect } from 'react';
import { apiClient } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function MyPage() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.get('/api/items?limit=200');
        setItems(data || []);
      } catch (e) {
        toast({ title: 'Ошибка загрузки', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (formData) => {
    try {
      await apiClient.post('/api/items', formData);
      toast({ title: 'Сохранено' });
    } catch (e) {
      toast({ title: 'Ошибка сохранения', description: e.message, variant: 'destructive' });
    }
  };

  // ... render
}
```

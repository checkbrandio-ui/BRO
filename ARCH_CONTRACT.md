> **ПЕРВЫМ делом читай PROJECT_MEMORY.md — там вся история проекта.**

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
| CRM-администратор | JWT Bearer    | localStorage `base44_access_token` + `crm_admin_session` |
| Агентство         | access_code   | localStorage `agency_session` |
| Публичная форма   | form_token    | URL параметр          |

**Middleware:** проверяет `Authorization: Bearer <jwt>`, валидирует по таблицам `crm_admins` и `users`.

---

## API эндпоинты (все через /api/)

```
POST   /api/auth/crm-login          → { data: { admin, token } }
POST   /api/auth/agency-login       → { data: { agency, token } }

GET    /api/candidates              ← Bearer
POST   /api/candidates              ← Bearer
PATCH  /api/candidates/:id          ← Bearer

GET    /api/agencies                ← Bearer
POST   /api/agencies                ← Bearer
PATCH  /api/agencies/:id            ← Bearer

GET    /api/cities
GET    /api/cities/search?q=

GET    /api/users                   ← Bearer
GET    /api/crm-admins              ← Bearer
POST   /api/crm-admins              ← Bearer (super_admin only)

GET    /api/notifications           ← Bearer
GET    /api/assembly-points         ← Bearer

POST   /api/upload                  ← Bearer, multipart/form-data
                                    → { data: { file_url } }

GET    /api/candidate-forms         ← Bearer
POST   /api/candidate-forms         ← Bearer
GET    /api/candidate-logs          ← Bearer

POST   /api/fn/:name               ← функции (create-candidate-safe, search-cities, ...)
```

---

## Правила разработки

### Frontend
1. **Полная перезапись файла** — никогда не патчить через `sed` частично.  
   Всегда читать файл целиком (`cat`), редактировать, записывать целиком.
2. **Токен** — хранится в `localStorage` под ключом `base44_access_token`.
3. **API_URL** — всегда через `import.meta.env.VITE_API_URL || 'https://api.bro-crm.ru'`.
4. **Ошибки** — каждый `onSave` / `handleSubmit` обёрнут в `try/catch`,  
   ошибка показывается в UI (не `alert`, не `console.log`).
5. **Состояния** — все `useState` объявлены в теле компонента, не в JSX.
6. **Сборка** — `npx vite build` перед каждым `git push`. Pre-push хук блокирует сломанный код.

### Backend
1. Все роуты в `/var/www/backend/src/routes/`.
2. Каждый роут: `try/catch` → `res.status(500).json({ data: null, error: e.message })`.
3. PATCH — динамический UPDATE по переданным полям (не перезаписывать всё).
4. При ошибке валидации — `400`, при дубле — `409`, при не найдено — `404`.
5. После изменений на VPS: `pm2 restart crm-backend`.

### Деплой
1. `git push` → Vercel автоматически деплоит frontend.
2. Backend изменения — напрямую по SSH на VPS, перезапуск PM2.
3. После деплоя — запустить `bash smoke_test.sh` (12 проверок за 15 сек).

---

## Сущности БД (таблицы)

| Таблица          | Ключевые поля                                      |
|------------------|----------------------------------------------------|
| crm_admins       | id, email, full_name, role, access_code, is_active |
| agencies         | id, name, city, access_code(unique), is_active     |
| candidates       | id, full_name, birth_date, phone, agency_id        |
| cities           | id, name, lat, lon                                  |
| users            | id, email, full_name, role                         |
| notifications    | id, type, message, is_read, created_at             |
| assembly_points  | id, name, city, lat, lon                           |
| candidate_forms  | id, candidate_id, form_token, status               |
| candidate_logs   | id, candidate_id, action, actor_name, created_at  |

---

## Что НЕЛЬЗЯ делать

- ❌ Использовать `@base44/sdk` — удалён, заменён на `src/api/base44Client.js`
- ❌ Хранить секреты в коде — только в `.env` на VPS
- ❌ Делать `git push` без прохождения pre-push хука
- ❌ Говорить «готово» без проверки — сначала `smoke_test.sh`
- ❌ Патчить JSX через `sed` — только полная перезапись файла

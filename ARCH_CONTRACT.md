# 🛡️ АРХИТЕКТУРНЫЙ КОНТРАКТ — Bratouverie CRM
**Версия: 1.0 | Дата: 2026-07-04**

> Этот документ — **закон для всей команды разработки**. Изменения в замороженных файлах без согласования запрещены.

---

## 🎯 Принцип двойной авторизации

Система использует **ДВЕ независимые системы авторизации**:

| Система | Кто | Как | Хранение | Файлы |
|---------|-----|-----|----------|-------|
| **Админ (CRM)** | Менеджеры Bratouverie | login page | `localStorage.base44_access_token` | AuthContext, ProtectedRoute, AdminRoute |
| **Агентство** | Кадровые агентства-партнёры | код доступа (agency_code) | `sessionStorage.agency_session` | AgencyLogin, AgencyWorkspace, AgencyNotifications |

**Золотое правило**: эти системы **НИКОГДА не пересекаются**. Агентства не используют `base44.auth.*`, админы не используют `agency_session`.

---

## 🚫 ЗАМОРОЖЕННЫЕ ФАЙЛЫ (НЕ ТРОГАТЬ)

### Авторизация и доступ

| Файл | Почему заморожен | Последствия изменения |
|------|-----------------|----------------------|
| `src/lib/AuthContext.jsx` | Ядро авторизации админов. Проверяет `me()` для CRM. | 401 на публичных страницах, слом всей авторизации |
| `src/lib/hasBase44Token.js` | Единственный щит перед `me()`. Используется ВЕЗДЕ. | Потеря щита, каскад 401 ошибок |
| `src/components/ProtectedRoute.jsx` | Шлюз защищённых маршрутов для админов. | Все админские страницы станут публичными |
| `src/components/AdminRoute.jsx` | Защита admin-only маршрутов. | Неавторизованные получат доступ к управлению |
| `src/pages/AgencyLogin.jsx` | Точка входа для агентств. Записывает `agency_session`. | Все агентства потеряют доступ |
| `src/api/base44Client.js` | Центральный SDK-клиент. Все сущности идут через него. | Слом всех запросов к API |

### Сущности данных (CRM)

| Сущность | Назначение | Критическая связка |
|----------|-----------|-------------------|
| `Candidate` | Карточка кандидата | `form_token` привязывает к `CandidateForm` |
| `CandidateForm` | Анкета кандидата | `candidate_id` + `form_token` — связь с карточкой |
| `Agency` | Кадровое агентство | `access_code` — вход для агентства |
| `City` | Справочник городов с координатами | `lat`, `lon`, `is_assembly_point` — для логистики |
| `Notification` | Уведомления | Привязаны к `candidate_id` + `agency_id` |

### Backend-функции (ядро)

| Function | Назначение | Защитная связка |
|----------|-----------|----------------|
| `createCandidateSafe` | Создание кандидата с проверкой дублей | ЕДИНСТВЕННЫЙ способ создания карточки |
| `ensureCandidateForm` | Гарантия связки Candidate → CandidateForm | Запускается автоматизацией при создании |
| `notifyCandidateChanges` | Уведомления при создании/изменении | Триггер для всей коммуникации |
| `findNearestCity` | Автоопределение точки сбора | Работает БЕЗ авторизации (service role) |
| `sendFormLink` | Отправка email со ссылкой на анкету | Зависит от `form_token` |

---

## 📜 ЗАМОРОЖЕННЫЕ СВЯЗКИ (НЕ НАРУШАТЬ)

### 🔗 Кандидат → Анкета → Токен

```
Candidate (form_token) ──→ CandidateForm (form_token + candidate_id)
         │
         └── При создании Candidate с form_token
             → АВТОМАТИЗАЦИЯ ensureCandidateForm
             → Создаёт CandidateForm (status: 'pending')
             → Две сущности всегда синхронизированы
```

**Правило**: `form_token` генерируется в `createCandidateSafe` (или `generateFormToken` в Candidates.jsx). Никогда не создавать `CandidateForm` напрямую — только через `ensureCandidateForm`.

### 🔗 Агентство → Кандидат

```
Agency (id, access_code) ──→ Candidate (agency_id)
         │
         └── При создании из AgencyWorkspace
             → agency_id берётся из sessionStorage.agency_session
             → НЕ из base44 user
```

**Правило**: `agency_id` в Candidate берется из `getAgencyId()` (sessionStorage). Никогда не из `user.id`.

---

## ✅ РАЗРЕШЁННЫЕ операции

Эти файлы **МОЖНО и НУЖНО** улучшать:

| Файл | Что улучшать |
|------|-------------|
| `src/pages/admin/Candidates.jsx` | Таблица, фильтры, статистика, UI |
| `src/components/admin/CandidateModal.jsx` | Форма карточки, загрузка документов, tabs |
| `src/pages/CandidateOnboarding.jsx` | UX анкеты, валидация, загрузка файлов |
| `src/pages/admin/Assistant.jsx` | ИИ-функции, подсказки |
| `src/lib/candidateLogger.js` | Формат логов, новые события |
| `src/lib/docUtils.js` | Типы документов, валидация |
| `base44/functions/sendFormLink/entry.ts` | Email-шаблоны, обработка ошибок |
| `base44/functions/notifyCandidateChanges/entry.ts` | Новые поля, новые получатели |

---

## 🚨 АНТИПАТТЕРН — ЗАПРЕЩЁННЫЙ КОД

### ❌ НЕВЕРНО (вызывает 401):
```jsx
// В любом компоненте на публичной странице:
useEffect(() => {
  const user = await base44.auth.me(); // ← 401 на пуblic route!
}, []);
```

### ✅ ВЕРНО:
```jsx
import { hasAdminToken } from '@/lib/hasBase44Token';

// На публичной странице — без запроса:
const isAdmin = hasAdminToken(); // ← проверяет localStorage, НЕ 401

// На защищённой странице:
useEffect(() => {
  if (hasAdminToken()) {
    base44.auth.me().then(u => setUser(u)); // ← безопасно, уже знаем что токен есть
  }
}, []);
```

### ❌ НЕВЕРНО:
```jsx
// В AgencyWorkspace или любом агентском компоненте:
const { user } = useAuth(); // ← это base44 auth, не agency_session
```

### ✅ ВЕРНО для агентств:
```jsx
import { hasAgencySession, getAgencyId } from '@/lib/hasBase44Token';

if (!hasAgencySession()) navigate('/agency-login');
const agencyId = getAgencyId(); // ← sessionStorage, не base44 user
```

---

## 🏗️ НОВЫЕ КОМПОНЕНТЫ — ПРАВИЛА

При создании нового файла соблюдать:

1. **Backend function** → только в `base44/functions/<name>/entry.ts`
2. **UI компонент** → в `src/components/` или `src/pages/`
3. **Хелпер/утилита** → в `src/lib/`
4. **Никогда** не создавать бизнес-логику в UI компонентах — только читать/писать сущности

---

## 📋 Чеклист перед коммитом

Перед пушем любого изменения **проверь**:

- [ ] Изменяемый файл не в списке замороженных
- [ ] Нет новых вызовов `base44.auth.me()` на публичных страницах
- [ ] `agency_id` берётся из `getAgencyId()`, не из `user.id`
- [ ] Связка `Candidate → CandidateForm` не нарушена
- [ ] `form_token` всегда генерируется одним способом

---

## 🔧 Текущая конфигурация

- **App ID**: `69f4a665db2c72a42818d397`
- **App URL**: (пусто = default Base44 routing)
- **GitHub**: `bratouverie.github.io2` → `bratouverie-snb.ru`
- **token key**: `base44_access_token` (localStorage)
- **agency session key**: `agency_session` (sessionStorage)

---

_Изменения в этот документ вносятся только через отдельный PR с пометкой [ARCH-CONTRACT]. Автор: Господин / AI assistant._
# 🔧 Исправление 403 Forbidden в Dispatcher Functions

**Дата начала:** 2026-06-30  
**Статус:** ⚠️ В ПРОЦЕССЕ (требуется дополнительная диагностика)

---

## 📋 Описание проблемы

При входе администратором возникала ошибка **403 Forbidden** при использовании Dispatch Dashboard (8 основных действий):
1. Логистика (getCandidateLogistics)
2. Постановка задачи (createTaskNotification)
3. Контроль документов (checkCandidateDocuments)
4. Архивация отказников (archiveRefusedCandidates)
5. Аналитика (getCrmAnalytics)
6. Мониторинг событий (getCandidateEventLog)
7. Скрипт звонка (generateCallScript)
8. Ответ на тикет (respondToTicket)

---

## ✅ Исправления, применённые (30.06.2026)

### Файлы, которые были отредактированы:

| Файл | Изменение | Статус |
|------|-----------|--------|
| `base44/functions/archiveRefusedCandidates/entry.ts` | Разрешена роль `moderator` + улучшена проверка пользователя | ✅ |
| `base44/functions/createTaskNotification/entry.ts` | Добавлена проверка `user.id` | ✅ |
| `base44/functions/getCandidateLogistics/entry.ts` | Добавлена проверка `user.id` | ✅ |
| `base44/functions/checkCandidateDocuments/entry.ts` | Добавлена проверка `user.id` | ✅ |
| `base44/functions/getCrmAnalytics/entry.ts` | Добавлена проверка `user.id` | ✅ |
| `base44/functions/getCandidateEventLog/entry.ts` | Добавлена проверка `user.id` | ✅ |

### Результаты тестирования (30.06.2026)

Все функции вернули **200 OK**:
- `createTaskNotification` → 200 OK (859ms) ✅
- `archiveRefusedCandidates` → 200 OK (1013ms) ✅
- `getCandidateLogistics` → 200 OK (1009ms) ✅
- `getCrmAnalytics` → 200 OK (870ms) ✅
- `checkCandidateDocuments` → 200 OK (883ms) ✅

---

## ⚠️ ВАЖНО: 403 всё ещё появляется в UI

Несмотря на исправления в backend:
- Backend функции работают при прямом вызове
- 403 ошибка может появляться из-за:
  - Проверки прав на уровне **Frontend** (`DispatchDashboard.jsx`)
  - Ограничений прав в **Entity permissions** (agent tool_configs)
  - Проблемы с сессией/токеном при вызове из UI

### Что нужно проверить далее:
1. **Фронтенд:** Может ли админ вообще вызвать функции через `base44.functions.invoke()`?
2. **Agent permissions:** Проверить `crm_helper` агент — имеет ли он нужные права на функции?
3. **Entity RLS:** Есть ли ограничения на создание Notification, обновление Candidate?

---

## 🔄 Как продолжить работу

### Шаг 1: Включить режим Debug
```javascript
// В DispatchDashboard.jsx добавить логирование
console.error('403 Error:', error);
console.log('User role:', userRole);
console.log('Attempting function:', functionName);
```

### Шаг 2: Проверить права агента
Файл: `base44/agents/crm_helper.jsonc`
- Убедиться, что `tool_configs` содержит все 8 функций
- Проверить, что функции не имеют ограничений

### Шаг 3: Проверить права на сущности
- `Notification.create` — нужна ли роль admin?
- `Candidate.update` — какие ограничения?
- `AgentTicket.update` — какие ограничения?

### Шаг 4: Полная переишифровка DispatchDashboard
Если проблема в UI, может потребоваться переписать логику вызова функций

---

## 📁 Файлы для быстрого доступа

- Backend функции: `base44/functions/*/entry.ts`
- UI компонент: `src/components/admin/DispatchDashboard.jsx`
- Конфиг агента: `base44/agents/crm_helper.jsonc`
- Widget: `src/components/admin/AssistantWidget.jsx`

---

## 🎯 Следующие действия

- [ ] Добавить логирование ошибок в DispatchDashboard
- [ ] Проверить права агента в crm_helper
- [ ] Проверить RLS на сущностях
- [ ] Переписать логику вызова функций, если нужно
- [ ] Финальный тест всех 8 действий от админа

---

**Статус:** Готово к продолжению. Все исправления задокументированы, можно вернуться к этой задаче в любой момент.
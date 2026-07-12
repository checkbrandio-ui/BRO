# DEVELOPMENT_APPROACH — BRO-CRM
### Подход к разработке: 7 раз отмерь, 1 раз отрежь

> Этот документ описывает обязательный процесс работы с кодом.
> Написан по итогам сессии 13.07.2026.
> Читать вместе с PROJECT_MEMORY.md и ARCH_CONTRACT.md.

---

## Главный принцип

**Медленно но верно — лучше быстро но застрять на исправлениях.**

Этот проект — CRM с реальными данными кандидатов и живыми агентствами.
Один сломанный коммит в неудачный момент = агентство не может работать.
Поэтому скорость измеряется не количеством файлов в час, а количеством
файлов без регрессий.

---

## Цикл работы с каждым файлом

Каждое изменение проходит 5 этапов без исключений:

```
ЧИТАЮ → АНАЛИЗИРУЮ → ПИШУ → ПРОВЕРЯЮ → ФИКСИРУЮ
```

---

## Этап 1 — ЧИТАЮ

- Читаю файл **целиком** через GitHub API или `cat` на сервере
- Никогда не работаю по памяти или предыдущей сессии — только свежее чтение
- Параллельно читаю файлы которые **вызывают** этот файл и которые **он вызывает**
- Изолированных файлов не бывает — контекст вызова обязателен

---

## Этап 2 — АНАЛИЗИРУЮ

Перед тем как писать, составляю явный список изменений:

- Что именно заменяется (какой legacy-вызов → на что конкретно)
- Структура ответа API (`data.items` vs массив напрямую vs `data`)
- Есть ли `subscribe()` который нужно убрать или заменить на polling
- Есть ли `try/catch/finally` — если нет, добавить
- Есть ли дублирование `_h()` / `_api` / `const API` — убрать
- Не сломает ли изменение соседние компоненты

> Если нахожу неожиданный нюанс — сообщаю **до** того как пишу код.

---

## Этап 3 — ПИШУ

Только **полная перезапись файла**. Никаких патчей, никаких sed.

### Чеклист перед отдачей файла:

```
✓ import { apiClient } from '@/api/base44Client' — есть
✓ Нет base44.entities.* — проверено
✓ Нет локальных _h() / _api / const API = ... — проверено
✓ Все загрузки в try/catch/finally — есть
✓ setLoading(false) строго в finally — есть
✓ Ошибки показываются в UI через toast — есть
✓ apiClient не оборачивается в .json() — проверено
✓ agency_session без access_code — проверено (если файл касается агентств)
✓ Бизнес-логика не изменена — только транспортный слой
```

> Последний пункт критичен: миграция меняет только API-слой, не поведение.

---

## Этап 4 — ПРОВЕРЯЮ

После каждого пакета — не в конце всей миграции, а после каждой группы файлов.

### 4а. Сборка фронта:
```bash
npm run build
```
Если сломана — не пушим, разбираемся сразу.

### 4б. Smoke-тест на сервере:
```bash
ssh root@193.200.74.125
cd /app/bro-repo && bash smoke_test.sh
```
Ожидаем **12/12 PASS**. Любой FAIL — стоп, разбираемся до следующего пакета.

### 4в. Живая проверка UI (для критичных путей):
| После пакета | Что проверить |
|---|---|
| lib-нотификаторы | Создать кандидата → проверить нотификацию |
| Agencies.jsx | Открыть список, создать тестовое агентство |
| AgencyWorkspace.jsx | Логин агентства → добавить кандидата → загрузить файл |
| CandidateModal-экосистема | Открыть модал, сохранить, проверить логи |
| Финал | Полный end-to-end всех трёх ролей |

---

## Этап 5 — ФИКСИРУЮ

### Коммит с понятным сообщением:
```
refactor(agencies): migrate to apiClient, add try/catch/finally
refactor(notify): migrate 4 lib notifiers to REST apiClient
refactor(agency-workspace): migrate 14 base44.entities calls to apiClient
```

### Обновление PROJECT_MEMORY.md:
Сразу после коммита — отмечаю файл в таблице миграции.
Не в конце сессии, не "потом" — сразу.

---

## Порядок пакетов миграции

```
ПАКЕТ А — lib-нотификаторы (4 файла)           [низкий риск]
  notifyLogisticsChange.ts
  notifyStatusChange.ts
  notifyFinalCallConfirmed.ts
  candidateLogger.ts
  Все делают POST /api/notifications или /api/candidate-logs
  → 1 коммит → smoke_test → проверить нотификацию в UI

ПАКЕТ Б — Agencies.jsx (1 файл)                [средний риск]
  Изолированная страница, понятный CRUD
  → 1 коммит → smoke_test → открыть список агентств

ПАКЕТ В — AgencyWorkspace.jsx (1 файл)         [высокий риск]
  Самый большой, 14 вызовов legacy
  Критичен для агентств — полный end-to-end после
  → 1 коммит → smoke_test → логин агентства → добавить кандидата

ПАКЕТ Г — CandidateModal-экосистема (6 файлов) [средний риск]
  FormLinkModal, InlineCommentCell, LogisticsHistory,
  GeneratedDocumentsSection, RegenerateLinkButton, CandidateFormView
  Читать все вместе — они связаны через одни данные
  → 1 коммит → smoke_test

ПАКЕТ Д — городские компоненты (3 файла)       [низкий риск]
  CitySelect, AddCityModal, CityEditModal
  Простые, один паттерн
  → 1 коммит → smoke_test

ПАКЕТ Е — нотификации и прочее (6 файлов)      [средний риск]
  NotificationBell, AgencyNotificationBell,
  DispatchDashboard, AgencyNotifications,
  DocumentGenerator, CandidateFormView
  → 1 коммит → smoke_test → финальный end-to-end
```

---

## Паттерны замены (справочник)

Все замены в проекте сводятся к 4 паттернам:

```js
// ДО (legacy)                          // ПОСЛЕ (apiClient)
Entity.list()                    →      apiClient.get('/api/entity?limit=200')
Entity.get(id)                   →      apiClient.get(`/api/entity/${id}`)
Entity.create(data)              →      apiClient.post('/api/entity', data)
Entity.update(id, data)          →      apiClient.patch(`/api/entity/${id}`, data)
Entity.delete(id)                →      apiClient.delete(`/api/entity/${id}`)
Entity.filter({ key: val })      →      apiClient.get(`/api/entity?key=${val}&limit=200`)
Entity.subscribe(cb)             →      убрать; polling через setInterval если нужно
base44.functions.invoke(name, d) →      apiClient.post(`/api/fn/${name}`, d)
```

### Маппинг Entity → endpoint:
```
Candidate     → /api/candidates
Agency        → /api/agencies
City          → /api/cities
Notification  → /api/notifications
AssemblyPoint → /api/assembly-points
CandidateForm → /api/candidate-forms
CandidateLog  → /api/candidate-logs
AgentTicket   → /api/agent-tickets
User          → /api/users
CrmAdmin      → /api/crm-admins
```

---

## Стоп-сигналы

Останавливаюсь и сообщаю до продолжения если:

- Файл содержит логику которую не понимаю до конца
- smoke_test даёт FAIL который не могу объяснить
- Нахожу баг не связанный с миграцией, но опасный
- Структура ответа API отличается от ожидаемой компонентом
- Бизнес-логика и транспортный слой слишком переплетены для безопасного разделения

---

## Чего не делаю никогда

- ❌ Не говорю «готово» без smoke_test
- ❌ Не меняю бизнес-логику в процессе миграции
- ❌ Не пропускаю чтение файла «потому что помню»
- ❌ Не пушу если сборка не прошла
- ❌ Не работаю с несколькими пакетами одновременно
- ❌ Не обновляю PROJECT_MEMORY «потом» — только сразу

---

*Документ создан: 13.07.2026 | Автор: Vesper (Base44 Superagent)*
*Обновлять при изменении процесса разработки.*

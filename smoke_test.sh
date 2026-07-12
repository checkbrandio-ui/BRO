#!/bin/bash
# ============================================================
#  BRO-CRM Smoke Test
#  Запуск: bash smoke_test.sh
#  Проверяет все критичные эндпоинты за ~15 секунд
# ============================================================

API="https://api.bro-crm.ru"
PASS=0; FAIL=0

green() { echo -e "\033[32m✅ PASS\033[0m $1"; ((PASS++)); }
red()   { echo -e "\033[31m❌ FAIL\033[0m $1 — $2"; ((FAIL++)); }

echo ""
echo "========================================"
echo "  BRO-CRM Smoke Test  $(date '+%Y-%m-%d %H:%M')"
echo "========================================"
echo ""

# --- Auth ---
echo "[ AUTH ]"
TOKEN=$(curl -s -X POST "$API/api/auth/crm-login" \
  -H "Content-Type: application/json" \
  -d '{"access_code":"BRO-ADMIN-2026"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('token',''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
  green "CRM login (BRO-ADMIN-2026)"
else
  red "CRM login" "токен не получен"; TOKEN=""
fi

AH="Authorization: Bearer $TOKEN"

# --- Основные GET эндпоинты ---
echo ""
echo "[ ENDPOINTS ]"
for EP in candidates agencies cities users notifications assembly-points crm-admins; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/$EP" -H "$AH")
  if [ "$CODE" = "200" ]; then
    green "GET /api/$EP ($CODE)"
  else
    red  "GET /api/$EP" "HTTP $CODE"
  fi
done

# --- Создание кандидата ---
echo ""
echo "[ CRUD ]"
CAND=$(curl -s -X POST "$API/api/candidates" \
  -H "Content-Type: application/json" -H "$AH" \
  -d '{"full_name":"Smoke Test Кандидат","phone":"+79000000001","position":"Тестировщик"}')
CAND_ID=$(echo "$CAND" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('id',''))" 2>/dev/null)
if [ -n "$CAND_ID" ]; then
  green "POST /api/candidates (id=$CAND_ID)"
else
  red "POST /api/candidates" "$(echo $CAND | python3 -c 'import sys,json; print(json.load(sys.stdin).get("error","?"))' 2>/dev/null)"
fi

# Создание агентства
AG=$(curl -s -X POST "$API/api/agencies" \
  -H "Content-Type: application/json" -H "$AH" \
  -d "{\"name\":\"Smoke Test Agency\",\"access_code\":\"SMOKE-$(date +%s)\"}")
AG_ID=$(echo "$AG" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('id',''))" 2>/dev/null)
if [ -n "$AG_ID" ]; then
  green "POST /api/agencies (id=$AG_ID)"
else
  red "POST /api/agencies" "$(echo $AG | python3 -c 'import sys,json; print(json.load(sys.stdin).get("error","?"))' 2>/dev/null)"
fi

# --- Очистка тестовых данных ---
echo ""
echo "[ CLEANUP ]"
if [ -n "$CAND_ID" ]; then
  curl -s -X PATCH "$API/api/candidates/$CAND_ID" \
    -H "Content-Type: application/json" -H "$AH" \
    -d '{"deleted_at":"2099-01-01"}' > /dev/null
  green "Удалён тестовый кандидат"
fi
if [ -n "$AG_ID" ]; then
  curl -s -X PATCH "$API/api/agencies/$AG_ID" \
    -H "Content-Type: application/json" -H "$AH" \
    -d '{"deleted_at":"2099-01-01"}' > /dev/null
  green "Удалено тестовое агентство"
fi

# --- Итог ---
echo ""
echo "========================================"
echo "  Итог: ✅ $PASS passed  ❌ $FAIL failed"
echo "========================================"
echo ""
[ $FAIL -eq 0 ] && exit 0 || exit 1

# --- Staging healthcheck ---
echo ""
echo "[ STAGING ]"
STAGING_HEALTH=$(curl -s http://193.200.74.125:3001/health 2>/dev/null)
if echo "$STAGING_HEALTH" | grep -q "staging"; then
  green "Staging сервер (порт 3001) — online"
else
  red "Staging сервер" "не отвечает или не staging env"
fi

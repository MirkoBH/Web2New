#!/bin/bash
# ─────────────────────────────────────────────────────────────
# AutoPulse – Script de prueba de endpoints
# Ejecutar con: bash test-api.sh
# Asegurarse de que el servidor esté corriendo en puerto 3000
# ─────────────────────────────────────────────────────────────

BASE="http://localhost:3000/api"
echo "🧪 Probando AutoPulse API..."
echo ""

# ── 1. Registro de vendedor ───────────────────────────────────
echo "1️⃣  POST /auth/register (vendedor)"
RESP_REG=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test Vendedor","email":"vendedor@test.com","password":"Test1234!","role":"vendedor","telefono":"1155555555"}')
echo "$RESP_REG" | python3 -m json.tool 2>/dev/null || echo "$RESP_REG"
echo ""

# ── 2. Login ──────────────────────────────────────────────────
echo "2️⃣  POST /auth/login"
RESP_LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"vendedor@test.com","password":"Test1234!"}')
echo "$RESP_LOGIN" | python3 -m json.tool 2>/dev/null || echo "$RESP_LOGIN"
TOKEN=$(echo "$RESP_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
echo "🔑 Token: ${TOKEN:0:40}..."
echo ""

# ── 3. Crear auto ─────────────────────────────────────────────
echo "3️⃣  POST /cars (crear auto)"
RESP_CAR=$(curl -s -X POST "$BASE/cars" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "marca":"Toyota","modelo":"Corolla","anio":2021,
    "kilometraje":45000,"transmision":"Automatico",
    "combustible":"Nafta","precio":19500,
    "ubicacion":"Buenos Aires",
    "descripcion":"Excelente estado, único dueño, services al día.",
    "color":"Gris"
  }')
echo "$RESP_CAR" | python3 -m json.tool 2>/dev/null || echo "$RESP_CAR"
CAR_ID=$(echo "$RESP_CAR" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
echo "🚗 Auto ID: $CAR_ID"
echo ""

# ── 4. Listar autos ───────────────────────────────────────────
echo "4️⃣  GET /cars (listado público)"
curl -s "$BASE/cars" | python3 -m json.tool 2>/dev/null
echo ""

# ── 5. Perfil usuario ─────────────────────────────────────────
echo "5️⃣  GET /users/me (perfil autenticado)"
curl -s "$BASE/users/me" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null
echo ""

echo "✅ Pruebas completadas"

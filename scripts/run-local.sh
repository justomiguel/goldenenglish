#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -d node_modules ]]; then
  echo "→ node_modules no encontrado; ejecutando npm install…"
  npm install
fi

if [[ ! -f .env.local.golden && ! -f .env.local.mozarthitos ]]; then
  echo "⚠ No hay .env.local.golden ni .env.local.mozarthitos."
  echo "  Primera vez: cp .env.example .env.local.golden  (o migrá: cp .env.local .env.local.golden)"
  echo "  Mozarthitos:   cp .env.local.golden .env.local.mozarthitos  y editá URLs / Supabase."
  echo ""
fi

echo "→ Elegí target (golden | mozarthitos); ver también npm run dev:golden / dev:mozarthitos"
echo "→ http://localhost:3000 — Ctrl+C para detener | dev:clean borra .next"
exec npm run dev

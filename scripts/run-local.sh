#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -d node_modules ]]; then
  echo "→ node_modules no encontrado; ejecutando npm install…"
  npm install
fi

if [[ ! -f .env.local ]]; then
  echo "⚠ No existe .env.local."
  echo "  Primera vez: cp .env.example .env.local y completá TENANTS_CONFIG_JSON."
  echo ""
fi

echo "→ Elegí instituto desde TENANTS_CONFIG_JSON (.env.local); ver también npm run dev:<slug>"
echo "→ http://localhost:3000 — Ctrl+C para detener | dev:clean borra .next"
exec npm run dev

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -d node_modules ]]; then
  echo "→ node_modules no encontrado; ejecutando npm install…"
  npm install
fi

if [[ ! -f .env.local ]]; then
  echo "⚠ No existe .env.local. Copia .env.example y rellena las variables:"
  echo "  cp .env.example .env.local"
  echo ""
fi

echo "→ Iniciando servidor de desarrollo en http://localhost:3000"
echo "  (Ctrl+C para detener)"
echo "  (usa 'npm run clean' para borrar cache si hay problemas)"
exec npm run dev

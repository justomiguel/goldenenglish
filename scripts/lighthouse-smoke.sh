#!/usr/bin/env bash
set -euo pipefail
# Smoke Lighthouse (Performance + Accessibility) sobre URL pública.
# Uso: BASE_URL=http://localhost:3000 npm run lighthouse:smoke
# Requiere Chrome/Chromium instalado (GitHub Actions: ubuntu-latest lo trae).

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${ROOT}/.lighthouse"
mkdir -p "${OUT_DIR}"

if [[ -z "${BASE_URL:-}" ]]; then
  echo "Set BASE_URL (e.g. http://localhost:3000) for the locale path to audit." >&2
  exit 1
fi

URL="${BASE_URL%/}/es"
echo "Auditing ${URL} …"

npx --yes lighthouse@12 "${URL}" \
  --preset=desktop \
  --only-categories=performance,accessibility \
  --output=html \
  --output-path="${OUT_DIR}/report.html" \
  --chrome-flags="--headless=new --no-sandbox" \
  --quiet

echo "Report: ${OUT_DIR}/report.html"

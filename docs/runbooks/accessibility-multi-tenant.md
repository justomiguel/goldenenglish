# Accesibilidad multi-tenant: alcance automatizado vs manual

Este runbook aclara **qué se puede ejecutar tenant por tenant** y **qué no sustituye** una auditoría WCAG completa.

## Por qué el contraste del tema ≠ “pasa accesibilidad”

Los tokens en `SYSTEM_PROPERTIES_DEFAULTS`, `site_themes.properties` y migraciones pueden **cumplir ratios de contraste** (WCAG 1.4.3 / 1.4.11) en las combinaciones que el DS usa. Eso **no** demuestra:

- recorrido teclado en todo el flujo (modales, menús, tablas);
- foco visible coherente en cada superficie;
- etiquetas, roles y `aria-*` correctos en componentes compuestos;
- formularios (errores, `fieldset`, anuncios);
- Lighthouse sólo sobre **una URL** elegida por deploy.

Por eso no se garantiza literalmente que “**todos los tenants pasan accesibilidad**” hasta combinar automatización donde exista **y** QA manual dirigido.

Los audits **automáticos** de Lighthouse también detectan problemas que **no** son solo contraste: **`<html lang>`** (idioma del documento), **nombres de enlaces** (`link-name`) en cabeceras responsivas, etc. Patrones y checklist del repo: [**`26-accessibility-contrast.mdc`**](../../.cursor/rules/26-accessibility-contrast.mdc).

---

## Lighthouse por URL / tenant (automático)

El script recorre un manifiesto JSON de URLs públicas y ejecuta Lighthouse **solo** categorías **performance** + **accessibility** (preset desktop).

```bash
# Manifiesto local (gitignored): copiar el ejemplo y poner previews reales por proyecto Vercel
cp scripts/a11y-lighthouse-manifest.example.json scripts/a11y-lighthouse-manifest.local.json
# Editá `slug` + `url` (incluye locale `/es`, `/pt`, … si aplica)

npm run lighthouse:a11y:tenants
```

Opciones del script (`node scripts/a11y-lighthouse-tenants.mjs`):

- Manifest explícito: `node scripts/a11y-lighthouse-tenants.mjs path/to/manifest.json`
- Umbral opcional accesibilidad (score 0–1, Lighthouse): `--min-accessibility 0.9`
- Umbral opcional rendimiento: `--min-performance 0.5`

**Requiere Chromium** instalado en el PATH (similar a `npm run lighthouse:smoke`; en CI típico `ubuntu-latest` ya lo trae).

### Estrategia útil por tenant

1. **Deploy preview** por proyecto (`npm run deploy:vercel -- <slug>` o ya publicado).
2. Añadir en el manifiesto una fila **`slug`** estable + **`url`** absoluta (`https://*.vercel.app/es` según rutas públicas auditables).
3. Para marca forzada con `SITE_BRAND_THEME_SLUG` en local **una sola** app en `:3000`, podés ejecutar Lighthouse **tras** `npm run dev:<slug>` y volcar `http://localhost:3000/<locale>` como una fila más (un tenant por arranque, no paralelo en el mismo puerto sin proxy).

Los informes intermedios JSON se borran después de leer scores; errores aparecen por stdout.

### Cuando ves `FAILED` y `accessibilityPct: n/a` (Lighthouse no puntuó)

No demuestra regresión WCAG: suele ser **entorno** (URL o servidor):

| Síntoma | Causa típica |
|---------|----------------|
| `WARN: Nothing accepted TCP on 127.0.0.1:3000` | Next no está corriendo. Antes ejecutá `npm run dev:golden` (u otro `dev:<slug>`) y repetí. |
| `Chrome prevented page load with an interstitial` en HTTP local | Misma causa: Chromium no llega a una respuesta útil (`ERR_CONNECTION_*` / página vacía). |
| Lighthouse `NO_FCP` / “did not paint any content” usando `http://127.0.0.1:…` | En macOS/Next dev el headless de Chromium a veces **no pinta FCP** sobre `127.0.0.1`. Usá **`http://localhost:3000/...`** en el manifiesto, o dejá que el script **`a11y-lighthouse-tenants.mjs`** convierta automáticamente `127.0.0.1` → `localhost`. |
| Lighthouse “unable to reliably load”, `404` en HTTPS | Host de placeholder, preview viejo borrado, o locale mal (`/es` vs ruta real). Corregí el manifiesto. |

Cuando Lighthouse devuelve **número** (% accesibilidad/rendimiento) y es bajo sí conviene revisar audits concretos en el CLI o generar `--output=html` aparte si lo necesitás para depuración.

---

## Complementos manuales (recomendado antes de llamar verde absoluto)

- **Teclado:** Tab / Shift+Tab / Escape en landing y una pantalla Tier A si el tenant tiene dashboard alumno/padres.
- **Lectores:** comprobar título útil y navegación en home + un flujo público corto (registro/contacto si existe).
- **Playwright axe** si el repo añade E2E: extensión natural para regresiones puntuales (no repetido tenant-a-tenant aquí).

---

## Referencias internas

- Smoke simple una URL: `npm run lighthouse:smoke` + [`scripts/lighthouse-smoke.sh`](../../scripts/lighthouse-smoke.sh)
- Alta tenant / targets: [`add-new-tenant.md`](./add-new-tenant.md), regla [**`19-multi-tenant-local-vercel-targets.mdc`**](../../.cursor/rules/19-multi-tenant-local-vercel-targets.mdc)
- Contraste de tokens UI: [**`26-accessibility-contrast.mdc`**](../../.cursor/rules/26-accessibility-contrast.mdc)

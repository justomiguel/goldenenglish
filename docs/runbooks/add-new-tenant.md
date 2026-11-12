# Alta de un nuevo tenant (Vercel + local + tema)

Este runbook sirve para **operadores humanos** y para **agentes de código**. Objetivo: dejar explícito **qué hay que saber antes de tocar el repo** y qué checklist técnico sigue al briefing.

## Briefing obligatorio (pedir esto antes de implementar)

Si alguien pide “agregá el tenant X”, **no asumir** defaults. Pedir (o completar) los puntos siguientes. Sin ellos faltan piezas (V deploy falla, landing roto, env sin pinchar marca).

| # | Tema | Qué pedir / confirmar |
|---|------|------------------------|
| 1 | **Slug canónico** | Identificador estable en minúsculas, sin espacios, ASCII (ej. `nago`). Se usa en archivos `.env.local.<slug>`, claves de `vercel-targets.json`, enum `site_theme_kind` si aplica, rutas `public/images/<slug>/`. |
| 2 | **Vercel** | ¿Proyecto ya creado y enlazado a este repo? Si sí: **Team ID** (`team_…`) y **Project ID** (`prj_…`). Si no: acordar quién lo crea y cuándo se pegan los IDs (o usar `vercel-targets.local.json` gitignored hasta tenerlos). |
| 3 | **Variables de entorno** | Mismo conjunto que un tenant existente (ver `.env.example`): Supabase URL/keys, `NEXT_PUBLIC_APP_URL`, secretos de email/analytics si aplica. Origen: copiar de otro tenant y reemplazar valores, o `pull-vercel-env` una vez definidas en el dashboard. |
| 4 | **Supabase** | ¿Base **dedicada** por instituto o compartida? URL de pooler / directa para migraciones locales. Confirmar que las migraciones del repo están aplicadas en esa BD. |
| 5 | **Marca en runtime** | ¿Debe forzarse un tema por slug con **`SITE_BRAND_THEME_SLUG=<slug>`** (varias marcas en una BD)? Si sí, el slug debe existir en `site_themes` y el target debe entrar en `BRAND_THEME_TARGETS` en `scripts/run-dev-with-target.mjs`. |
| 6 | **Plantilla de landing (`SiteThemeKind`)** | ¿**Reutiliza** `classic` / `editorial` / `minimal`? ¿Usa una plantilla del catálogo (`deportes`, `jardin`, …)? ¿O es **exclusiva de este cliente**? Si es exclusiva, completar la ficha de [`exclusive-landing-request.md`](exclusive-landing-request.md) antes de codear. Un tema exclusivo no entra a `GENERIC_INSTITUTE_KINDS`. |
| 7 | **Copy admin / público** | Nombre legible para el picker de plantilla en CMS (`kindPicker.options.<slug>` en `en.json` + `es.json`). Si hay secciones de landing con copy por marca, acordar namespaces (`landing.<marca>.*`) o reutilizar diccionario genérico. |
| 8 | **Assets estáticos** | ¿Hay imágenes iniciales para `public/images/<slug>/…` o se arranca con `.gitkeep` y se sube después vía CMS/storage? |

**Regla para agents:** si el mensaje solo dice “agregar tenant” sin slug, sin decisión de plantilla (§6) y sin datos Vercel (§2) cuando hace falta deploy, **pedir explícitamente** esa información en una sola respuesta con esta tabla (o checklist) antes de editar código.

## Theme document, no new code

A new tenant starts from a theme document and a starter token set. Do not add a file, a dictionary namespace, or a branch named after the slug. Client-only code, when the intake requires it, goes in `src/variants/owned/<slug>/` (rule `53`).

## Plantilla de solicitud (copiar y completar)

```
Tenant — briefing

- Slug canónico:
- Vercel: team ID + project ID (¿listo?):
- Supabase: ¿dedicado o compartido? (URL/ref):
- SITE_BRAND_THEME_SLUG: sí / no (y slug si distinto del tenant):
- Plantilla landing: classic | editorial | minimal | nueva SiteThemeKind (nombre):
- Nombre legible (admin ES/EN):
- Dominio / NEXT_PUBLIC_APP_URL prod:
- Assets: ¿hay imágenes en repo o solo CMS después?
```

## Checklist técnico (después del briefing)

Implementación alineada con:

- Regla del repo: [`.cursor/rules/19-multi-tenant-local-vercel-targets.mdc`](../../.cursor/rules/19-multi-tenant-local-vercel-targets.mdc)
- Deploy y `pull:env`: [`scripts/README.md`](../../scripts/README.md)
- Multi-sitio / overlay de marca: [`docs/adr/2026-04-multi-site-brand-overlay.md`](../adr/2026-04-multi-site-brand-overlay.md)

Resumen:

1. **Ops (casi siempre):** `.gitignore` → `.env.local.<slug>`; `vercel-targets.json` (o `.local`); `run-dev-with-target.mjs` (`TARGETS`, flag `--<slug>`, menú interactivo); `pull-vercel-env.mjs` (`OUT_FILES`); `package.json` (`dev:<slug>`, `pull:env:<slug>`); `apply-migration-all-tenants.mjs` (lista `TENANTS`); `.env.example` si aplica `SITE_BRAND_THEME_SLUG`.
2. **Admin operador (obligatorio):** el instituto queda con `justomiguelvargas@gmail.com` y `profiles.role = admin`. La contraseña está en `platform_settings.operator_admin_password`. La cambias en el panel de CentroListo, pestaña Operador. No la escribas en git. Lo hace `ensurePlatformOperatorAdmin` al generar el schema. Regla: [`.cursor/rules/52-platform-operator-admin.mdc`](../../.cursor/rules/52-platform-operator-admin.mdc).
3. **Deploy en serie:** `deploy-vercel.mjs --all` recorre **todas** las claves del JSON mergeado, **orden alfabético**; entradas sin `orgId`/`projectId` se omiten.
4. **Nueva plantilla (`SiteThemeKind`):** migración idempotente al enum; seed `site_themes`; `SITE_THEME_KINDS` en `src/types/theming.ts`; catálogos CMS / landing / media; `marketingLandingKinds` si el shell es full-bleed; diccionarios; tests (`isSiteThemeKind`); `masterdb.sql` si el equipo lo mantiene como vista de esquema.
5. **Superficie `/register` por tenant (obligatorio para landings con marca propia):** crear `Register<Tenant>Surface` + header dedicado (e.g. `<Tenant>RegisterHeader`), agregar la rama `templateKind === "<slug>"` en `src/app/[locale]/register/page.tsx`, copy en `landing.<marca>.register.*` (`en` + `es` + `pt`) y test en `src/__tests__/organisms/Register<Tenant>Surface.test.tsx`. Detalle y excepciones: [`.cursor/rules/28-tenant-register-surface.mdc`](../../.cursor/rules/28-tenant-register-surface.mdc).

## Verificación rápida

- `npm run dev:<slug>` levanta con el env correcto.
- `npm run pull:env:<slug>` escribe `.env.local.<slug>` (recordar variables sensibles en Vercel pueden venir vacías en pull).
- `npm run deploy:vercel -- <slug> --prod` (o `--all --prod`) apunta al proyecto esperado.
- Tras tener URLs de preview/producción, puedes automatizar Lighthouse (accesibilidad + rendimiento) por tenant con **`docs/runbooks/accessibility-multi-tenant.md`** (`npm run lighthouse:a11y:tenants`); no sustituye prueba manual de teclado/foco para decir WCAG «completo».

# Pedido de landing exclusiva

Este runbook es para una landing hecha para **un cliente**. Esa plantilla no entra al catálogo de CentroListo y no aparece en el selector de otros institutos.

Si el pedido se resuelve con una plantilla del catálogo (`deportes`, `jardin`, `colegio`, `musica`, `idiomas`, y las variantes `*2`) más paleta y textos, no abras un tema exclusivo. Sigue `docs/runbooks/add-new-tenant.md`.

## Cuándo es exclusiva

- El cliente pide una página con estructura propia (secciones, motion, registro con su marca).
- Esa página no debe poder activarse en otro instituto.
- El slug del tema no va a `GENERIC_INSTITUTE_KINDS`.

## Ficha (copiar y completar)

```
Landing exclusiva — ficha

- Cliente:
- Slug del tenant (dueño):
- Slug del tema (SiteThemeKind, ASCII, minúsculas):
- Nombre legible (ES / EN / PT):
- ¿Exclusiva? sí
- Dominio / NEXT_PUBLIC_APP_URL:
- Supabase: dedicado o compartido
- Vercel: team ID + project ID
- Paleta y fuentes:
- Logo y fotos (rutas o "las suben después"):
- Secciones de la landing:
- Copy inicial (ES / EN / PT) o "diccionario vacío con claves":
- Superficie /register: sí (regla 28)
- Web y PWA: las dos, o solo web con motivo
- Fecha y quién aprueba el diseño:
```

Sin slug de tenant, slug de tema y "exclusiva: sí", no se implementa.

## Orden de trabajo

1. Spec en `docs/superpowers/specs/` y aprobación.
2. ADR `docs/adr/YYYY-MM-<slug>-exclusive-theme.md` (contexto, decisión, opciones, consecuencias).
3. Migración aditiva: `ALTER TYPE public.site_theme_kind ADD VALUE '<slug>'`. Aplicar con:

```bash
npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/<archivo>.sql
```

4. Agregar el valor a `SITE_THEME_KINDS` en `src/types/theming.ts`.
5. Agregar la fila en `EXCLUSIVE_THEME_OWNERS` (`src/lib/theme/exclusiveThemeKinds.ts`). El valor es el slug del tenant dueño.
6. Landing, catálogo CMS y superficie `/register` (regla `.cursor/rules/28-tenant-register-surface.mdc`).
7. Diccionarios `en.json`, `es.json`, `pt.json`.
8. Tests: el dueño puede usar el tema, otro tenant recibe `kind_not_available`, y el catálogo de CentroListo no incluye el slug.
9. Entrada en `src/lib/product-changelog/` si el personal lo va a notar.

## Prohibido

- Meter el slug en `GENERIC_INSTITUTE_KINDS`.
- Mostrarlo en `buildPulsarTemplateCatalogCards`.
- Dejar el selector del CMS con `kinds` vacío para un tema a medida. Eso listaba todos los `SITE_THEME_KINDS`.

## Enlaces

- Alta de tenant: `docs/runbooks/add-new-tenant.md`
- Dueños y selector: `.cursor/rules/51-exclusive-client-themes.mdc`
- Registro: `.cursor/rules/28-tenant-register-surface.mdc`
- Migraciones: `.cursor/rules/45-institute-migration-apply.mdc`
- ADR del mecanismo: `docs/adr/2026-11-exclusive-client-themes.md`

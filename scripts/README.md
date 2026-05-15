# Scripts de operaciones (Golden English)

Índice rápido:

| Tema | Documentación / script |
|------|-------------------------|
| Deploy Vercel (un tenant o todos) | Esta página → [Deploy a Vercel (multi-tenant)](#deploy-a-vercel-multi-tenant) |
| **Alta de tenant: briefing (qué pedir) + checklist** | [`docs/runbooks/add-new-tenant.md`](../docs/runbooks/add-new-tenant.md) |
| **Lighthouse Accessibility multi-tenant** (manifiesto de URLs) | [`docs/runbooks/accessibility-multi-tenant.md`](../docs/runbooks/accessibility-multi-tenant.md) — `npm run lighthouse:a11y:tenants` |
| Alta de tenant (detalle técnico en regla) | [`.cursor/rules/19-multi-tenant-local-vercel-targets.mdc`](../.cursor/rules/19-multi-tenant-local-vercel-targets.mdc) |
| Modelo multi-sitio (marca / proyectos) | [`docs/adr/2026-04-multi-site-brand-overlay.md`](../docs/adr/2026-04-multi-site-brand-overlay.md) |
| Migración SQL a todas las BDs locales | [`apply-migration-all-tenants.mjs`](apply-migration-all-tenants.mjs) (cabecera del archivo) |
| Migración de assets públicos | [`README-public-assets-migration.md`](README-public-assets-migration.md) |

---

## Deploy a Vercel (multi-tenant)

Un **mismo repo** puede desplegarse a **varios proyectos Vercel** (uno por instituto / marca). El mapeo `slug del tenant → orgId + projectId` vive en:

- [`vercel-targets.json`](vercel-targets.json) (versionado; puede tener placeholders hasta completar IDs)
- [`vercel-targets.local.json`](vercel-targets.local.json) (opcional, gitignored; amplía o sobrescribe destinos)

### Requisitos

- [Vercel CLI](https://vercel.com/docs/cli) instalada y sesión iniciada: `vercel login`
- Cada entrada usada para deploy debe tener `orgId` y `projectId` válidos (Team ID y Project ID en el dashboard de Vercel)

### Un solo tenant

Preview (por defecto del CLI en proyectos enlazados; aquí se fuerza el proyecto vía env):

```bash
npm run deploy:vercel -- golden
```

Producción de ese proyecto:

```bash
npm run deploy:vercel -- golden --prod
```

Equivalente directo:

```bash
node scripts/deploy-vercel.mjs <slug> [--prod] [-y]
```

### Todos los tenants (recorre el JSON)

Despliega **en serie** cada clave definida en `vercel-targets.json` (+ merge con `.local`). Orden: **alfabético** por nombre de clave.

**Producción en todos los proyectos configurados:**

```bash
npm run deploy:vercel:all:prod
```

Equivalente:

```bash
node scripts/deploy-vercel.mjs --all --prod
```

También se puede usar el target literal `all`:

```bash
npm run deploy:vercel -- all --prod
```

Preview en todos (sin `--prod`):

```bash
node scripts/deploy-vercel.mjs --all
```

### Flags útiles

| Flag | Efecto |
|------|--------|
| `-y` / `--yes` | Se reenvía a `vercel` (menos prompts) |
| `--continue-on-error` | Solo con `--all`: si un proyecto falla, intenta el siguiente; el proceso termina con código ≠ 0 si hubo algún fallo |

Entradas **sin** `orgId` o `projectId` se **omiten** con un aviso (no corta el barrido).

### Relación con Git

Estos comandos publican el **árbol de código actual** en cada proyecto Vercel. No hacen `git push`. Si el equipo usa solo despliegues desde Git en producción, este script es una alternativa operativa explícita (CLI); alinear expectativas con el equipo.

### Variables de entorno en local

Para bajar env desde Vercel hacia `.env.local.<slug>`:

```bash
npm run pull:env:golden
# …otros slugs definidos en package.json (cada nuevo tenant añade su script)
```

Antes de pedir cambios en el repo para un tenant nuevo: [`docs/runbooks/add-new-tenant.md`](../docs/runbooks/add-new-tenant.md).

Detalle: [`pull-vercel-env.mjs`](pull-vercel-env.mjs).

### Ayuda en CLI

```bash
node scripts/deploy-vercel.mjs --help
```

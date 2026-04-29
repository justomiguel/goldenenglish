# Contexto

El producto comparte una base de código Next.js + Supabase; la marca institucional debe poder variar por despliegue (mismo repo, distinto proyecto Supabase / Vercel) sin bifurcar ramas por sitio.

Hoy `loadEffectiveProperties()` ya fusiona `system.properties` con la fila activa de `public.site_themes`, pero `getBrandPublic()` solo leía el archivo, de modo que emails, manifest, OG y JSON-LD ignoraban el overlay del tema activo.

# Decisión

- Introducir `getBrandForRequest()` en [`src/lib/brand/server.ts`](../../src/lib/brand/server.ts): `cache(async () => brandPublicFromProperties((await loadEffectiveProperties()).properties))`.
- Mantener `getBrandPublic()` síncrono para defaults de archivo y tests explícitos.
- Manifest y rutas OG leen colores vía `loadEffectiveProperties()`; logos usan URLs absolutas cuando `logoPath` es relativo (`resolveBrandLogoAbsoluteUrl`).
- Un solo [`vercel.json`](../../vercel.json); multi-sitio = N proyectos Vercel + N Supabase con variables de entorno propias (sin ramas por cliente).

# Opciones consideradas

- **Rama o carpeta por sitio con `vercel.json` distinto** — descartada: deuda de merge perpetua en migraciones y config operativa.
- **Multi-tenant en una sola BD** — fuera de alcance (RLS y modelo por tenant).
- **Solo env vars para marca** — insuficiente: el CMS ya modela `site_themes`; el overlay BD es la fuente única coherente con el CSS.

# Consecuencias

- **Positivo:** marca consistente entre CSS, metadata, PWA manifest, OG, emails y JSON-LD.
- **Riesgo:** tests que mockeaban `getBrandPublic` en server actions deben mockear `getBrandForRequest` (async).
- **Seguimiento (fuera de esta fase):** seeds por tenant bajo `supabase/seeds/`, vaciado gradual de identidad en `system.properties` cuando exista seed en prod.

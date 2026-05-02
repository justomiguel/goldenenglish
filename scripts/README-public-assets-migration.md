# Migración de `public/images` y `public/favicon_io` a Supabase Storage

## Alcance

- **Sí:** todo bajo `public/images/` (logo, `golden/*`) y `public/favicon_io/*`.
- **No:** `public/geo/` (GeoJSON compartido entre sitios), ni otros estáticos (`sw.js`, etc.).

El bucket **`landing-media`** ya existe (migración `046_site_themes.sql`). Este proceso **no añade DDL**: solo sube objetos y actualiza datos (`site_themes`, `site_theme_media`).

## Prerrequisitos

1. Migraciones aplicadas en tu proyecto Supabase.
2. Un **`site_themes` activo** (`is_active = true`), normalmente el tema sistema `default`.
3. Variables (p. ej. en `.env.local`):

   - `SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo para este script; no la uses en el cliente).

## Ejecución (este repo)

```bash
# Simular (lista ficheros; con credenciales también muestra rutas en Storage)
node scripts/migrate-public-assets.mjs --dry-run

# Migrar (sube, actualiza BD)
node scripts/migrate-public-assets.mjs

# Además: escribe `app.logo.path` / `app.favicon.path` en `system.properties`
node scripts/migrate-public-assets.mjs --write-system-properties

# Tras verificar la home: borrar `public/images` y `public/favicon_io` locales (re-ejecuta subida + BD; idempotente)
node scripts/migrate-public-assets.mjs --delete-public
```

**Importante:** `--delete-public` debe ejecutarse **después** de confirmar que la home y el CMS cargan bien desde Storage. Sin BD activa o sin tema activo, la home quedaría sin referencias válidas.

## Qué hace el script

1. Sube ficheros a `landing-media/<theme_id>/migration/...` (misma forma que rutas bajo `public/`).
2. Actualiza **`site_themes.properties`** del tema activo con:
   - `app.logo.path` = `<uuid>/migration/images/logo.png`
   - `app.favicon.path` = `<uuid>/migration/favicon_io/favicon.ico`  
   La app resuelve esas claves a URL pública vía `resolveBrandAssetUrl` (`src/lib/brand/resolveBrandAssetUrl.ts`).
3. Hace **upsert** en **`site_theme_media`** para slots de landing (inicio, historia, modalidades, certificaciones). Las certificaciones renombran en Storage a `certificaciones/1.png` … `3.png` según los capturas existentes (marcadores `1.31.36`, `1.31.42`, `1.31.48`).

La **home** ya usa `mediaMap` (`buildLandingMediaMap` + `resolveLandingImageSrc`) y **`LandingCertifications`** con `certificacionesSlotSrc`; no hace falta cambiar JSX tras la migración.

## Próximos sitios / tenants

1. **Proyecto Supabase propio** por marca o por entorno.
2. Subir assets con el mismo patrón (`<theme_id>/migration/...`) **o** usar el CMS de temas (subidas ya escriben `landing-media` + `site_theme_media`).
3. En **`site_themes.properties`**, usar **clave de objeto** (sin dominio) como arriba, o una URL `https://…` absoluta si sirves desde otro CDN.
4. Mantener **`NEXT_PUBLIC_SUPABASE_URL`** alineado en Vercel para que `resolveBrandAssetUrl` y `next/image` (`remotePatterns`) sigan funcionando.
5. No duplicar **`public/geo/`** por tenant; es compartido.

## NPM

```bash
npm run migrate:public-assets -- --dry-run
```

# Seed Golden English

Datos de ejemplo para el tenant **Golden English** del repo: tokens en `properties` alineados con [`../../../system.properties`](../../../system.properties) (identidad, paleta, sombras, layout, contacto y redes).

- **`slug`** `golden-english`: tema de marca explícito (distinto del row sistema `default`).
- **`is_active`**: el INSERT viene en **FALSE** para no competir con el tema activo que ya definas por CMS/migraciones; activa desde admin o con los `UPDATE` comentados en `seed.sql`.

Ejecutar **después** de migraciones. Idempotente vía `ON CONFLICT (slug)`.

## Logo, favicon y “imágenes en la BD”

En este proyecto **Postgres no guarda los ficheros de imagen** (PNG/ICO/WebP) como blobs para marca global: guarda **referencias** en JSON (`site_themes.properties`), típicamente:

| Qué | Dónde en datos | Dónde está el fichero |
|-----|----------------|------------------------|
| Logo / favicon institucional | Claves `app.logo.path`, `app.favicon.path` en `properties` | Rutas bajo `public/` del despliegue (p. ej. `/images/logo.png`) **o** URLs `https://…` públicas (p. ej. Supabase Storage). La app ya interpreta ambas (`brandPublicFromProperties`, `resolveBrandLogoAbsoluteUrl`, `buildWebManifestIcons`). |
| Imágenes de landing por sección (hero, etc.) | Tabla **`site_theme_media`** + tema activo | Bucket **`landing-media`** (subida desde el CMS admin); la BD guarda paths/referencias al objeto en Storage, no el binario dentro de una celda genérica. |

Por eso este seed usa las mismas rutas relativas que `system.properties`: asumen que el **bundle Next** incluye esos assets en `public/`. Para **multi-sitio** con URLs `https://…` en `properties`, sube logo/favicon al bucket y pon las URLs públicas: **`buildRootLayoutIcons`** (layout raíz) y **`buildWebManifestIcons`** (manifest) ya **no inventan** rutas tipo `…/favicon-16x16.png` junto a un `.ico` remoto (solo las derivan cuando favicon/logo son rutas relativas al sitio, p. ej. `/favicon_io/favicon.ico`). Si necesitas el mismo pack completo que `public/favicon_io/` pero en Storage, súbelo con la misma estructura de nombres bajo un prefijo por tenant y apunta `app.favicon.path` al `.ico` de ese prefijo.

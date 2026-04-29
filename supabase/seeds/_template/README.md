# Plantilla de seed por tenant

La carpeta [`../README.md`](../README.md) describe el propósito: datos **por proyecto Supabase / despliegue**, no DDL.

## Uso

1. Copia esta carpeta y renómbrala al **slug del tenant** (p. ej. `cp -R _template golden-institute`).
2. Abre `seed.sql` y sustituye:
   - `TENANT_SLUG` — valor único del row (`site_themes.slug`).
   - `TENANT_DISPLAY_NAME` — nombre visible en admin/CMS.
   - Los JSON `properties`, `content` y `blocks` según tu marca y el CMS (tokens como en `system.properties`, copy por sección/locale, bloques dinámicos).
3. Opcional: ajusta `template_kind` (`classic`, `editorial` o `minimal` según enum en tu BD).
4. Ejecuta el SQL **después** de aplicar todas las migraciones (`supabase db push`, CI, etc.).

## Un solo tema activo

Solo puede haber **una** fila con `is_active = true`. Si este seed debe activar el tema del tenant, desactiva el resto en la misma transacción (hay un ejemplo comentado al final de `seed.sql`) o hazlo desde el CMS.

No marques temas de tenant con `is_system_default = true`: ese flag está reservado al row `slug = 'default'` (ver migración `052_site_themes_system_default.sql`).

# Seeds por tenant (multi-sitio)

Las **migraciones** en [`../migrations/`](../migrations/) aplican a **todos** los proyectos Supabase y definen el esquema compartido (incl. `site_themes`).

La **identidad** de un instituto concreto (nombre, colores, contacto, fila `site_themes` activa) puede cargarse **fuera** de las migraciones, como datos propios de cada despliegue:

1. Copiar [`_template/`](_template/README.md) a `supabase/seeds/<tenant-slug>/` y editar `seed.sql`, o partir del ejemplo [`golden-english/`](golden-english/README.md).
2. Completar el JSON de `properties` / contenido según el CMS.
3. Ejecutar contra el proyecto Supabase del tenant (`supabase db execute …` o editor SQL), **después** de aplicar migraciones.
4. Imágenes bajo `public/images` / favicons: flujo documentado en [`../../scripts/README-public-assets-migration.md`](../../scripts/README-public-assets-migration.md).

No sustituye migraciones: no dupliques DDL aquí.

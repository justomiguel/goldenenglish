# Geo (compartido)

Los ficheros de esta carpeta (p. ej. `world.geojson`) son **comunes a todos los despliegues y marcas**. Van versionados en el repo y se sirven desde `/geo/…`.

No forman parte de migraciones a Supabase Storage pensadas para **marca / landing** (`public/images/`, `public/favicon_io/`): esos sí pueden ir al bucket por tenant; **geo no**.

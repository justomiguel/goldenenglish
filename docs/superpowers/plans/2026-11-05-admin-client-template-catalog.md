# Admin client template catalog

Spec: `docs/superpowers/specs/2026-11-04-admin-client-template-catalog-design.md`

1. Staff nav lists `/admin/plantillas` after Analítica. Owner nav stays the same. The item is active only on that path.
2. A pure builder returns one card per `GENERIC_INSTITUTE_KINDS`, with preview `src`, kind name, and `templatePreviewHref`.
3. `PulsarTemplateCatalog` renders the title, the lead, ten images, and ten links.
4. `/{locale}/admin/plantillas` uses the staff guards from Nuevo tenant and `centrolistoPrivatePageMetadata`.
5. Copy in `en.json`, `es.json`, and `pt.json`.

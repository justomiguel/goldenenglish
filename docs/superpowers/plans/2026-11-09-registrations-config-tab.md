# Inscripciones web configuration tab

Spec: `docs/superpowers/specs/2026-11-09-registrations-config-tab-design.md`

1. Add `parseRegistrationsPageTab` and a test. `config` wins. Any other value is `list`.
2. Add `AdminRegistrationsTabs` with `usePersistentPageTab` and `UnderlineTabBar`.
3. Add `AdminRegistrationsConfigPanel` with the inscription switch, section mode, public buttons, and cohort.
4. Wrap the lead list in the Inscripciones tab. Remove `AdminRegistrationCohortBar`.
5. Remove those forms from the institute settings page.
6. Revalidate `/dashboard/admin/registrations` from the three save actions that do not already do it.
7. Move the settings tour step to a registrations tab anchor. Update en, es, and pt.
8. Prepend a product changelog row.

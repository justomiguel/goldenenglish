# Inscripciones web — configuration tab

**Intent:** Staff open Inscripciones web and switch between the lead list and every public-registration setting.

**Done when:**

- Inscripciones web has two page tabs: **Inscripciones** and **Configuración**.
- **Inscripciones** shows the header, the create button, the stats row, and the lead list.
- **Configuración** shows the public-inscription switch, the section mode, the public buttons, and the web-inscription cohort.
- Those four controls leave Configuración del instituto.
- The cohort bar leaves the lead list. The same cohort control stays once, inside **Configuración**.
- `?tab=config` opens Configuración. A missing or unknown `tab` opens Inscripciones. The choice survives a remount (`usePersistentPageTab`).
- The settings screen tour no longer points at the moved cards. The registrations screen tour points at the new tabs.

**Out of scope:**

- New settings keys or a new save action. Reuse `setInscriptionsEnabled`, `setRegisterSectionMode`, `setPublicCtaMode`, and `setRegistrationCohortAction`.
- Merch, email sends, class reminders, questionnaires, and Google Translate. Those stay on Configuración del instituto.
- A change to how the public form reads those settings.

## Surfaces (Web vs PWA)

Inscripciones web is Tier B and already has two trees. `AdminRegistrationsScreen` picks `AdminRegistrationsTableDesktop` or `AdminRegistrationsScreenNarrow`.

The tabs sit in the page shell, above that switch. Both surfaces use the same tab bar and the same configuration forms. The list tab keeps the existing desktop table and the existing narrow list. Do not add a second PWA form.

Configuración del instituto stays desktop-only. Removing the two inscription cards does not change a Tier A screen.

## Decision

Query key is `tab`. Values are `list` and `config`. Default is `list`.

The page already uses `page`, `q`, `sort`, `dir`, `status`, and `inbox`. Keep those keys. A tab change must not drop them.

On `tab=config`, skip the paginated lead query. Still load the four setting values and the cohort config.

Rejected: leave the cohort bar on the list and also keep it in settings. That is the same control twice.

Rejected: stack the forms under the list with no tab. Staff asked for a tab named Configuración.

## Behavior

1. Move `InscriptionsSettingsForm` and `PublicCtaModeSettingsForm` into the Configuración tab.
2. Delete `AdminRegistrationCohortBar` from the list. The cohort select inside `InscriptionsSettingsForm` is the only cohort control.
3. Remove both forms from `src/app/[locale]/dashboard/admin/settings/page.tsx`.
4. Add tab copy in `en.json`, `es.json`, and `pt.json`. Spanish uses neutral tuteo.
5. Point `settingsInscriptions` tour steps at the new tab, or drop that step and add a registrations step on the tab bar. Update L1 and L2 with the anchor move.
6. Revalidate `/dashboard/admin/registrations` from the four existing save actions, in addition to the settings path they already revalidate.

## Tests

- Tab helper: `config` wins from the URL. An unknown value falls back to `list`.
- Registrations page shell: Configuración renders the section-mode legend and does not render the lead table.
- Settings page: the section-mode legend is absent.
- A save still calls the existing action. Do not add a second writer.

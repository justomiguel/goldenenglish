# Register: hide section combo unless “show all sections”

**Intent:** The public register form must not show “No estoy seguro/a” as a student choice. If the family has nothing to pick, hide the combo and submit the only (or default) section. Show other sections only when the institute has more than one open section **and** staff turn on **Mostrar todas las secciones** in Inscripciones.

**Done when:**

1. The student combo never lists `sectionUndecidedOption`.
2. **0 or 1** choosable section, **or** the new setting is off: the section picker (combo + calendar toggle) is hidden. A hidden field still sends the default section id (the only open section, or the first choosable one). If there is no open section, the hidden field keeps the existing undecided sentinel so submit still works; the person does not see that value.
3. **2+** choosable sections **and** the setting is on: show the picker with those sections (add-another stays). No undecided row.
4. Admin → settings → Inscripciones has a checkbox **Mostrar todas las secciones** (default **off**). Saving uses the same `site_settings` + audit + `revalidatePath` pattern as `inscriptions_enabled`.
5. Enrollment-link mode stays as today (locked section, extras if any).
6. Vitest covers hide vs show, hidden default id, no undecided option, and the settings toggle.

**Out of scope:**

- Changing how admin inbox labels old “undecided” leads.
- A separate admin picker for “which section is default” (first choosable section is the default).
- The DNI-survives-Continue bug (other spec).

## Surfaces (Web vs PWA)

- **Public register:** Tier A. Web and PWA both use shared `RegisterForm` / `RegisterSectionPicker`. Same hide/show rules. No new PWA tree.
- **Inscripciones settings:** Tier B — desktop-only. No PWA tree.

## Setting

- Key: `register_show_all_sections` in `public.site_settings`.
- Default: `false`.
- Additive migration: seed + add the key to `site_settings_select_public` (same list as `inscriptions_enabled`).
- Server helper next to `getInscriptionsEnabled`. Pass a boolean into `RegisterForm`.

## Visible rules

| Open sections | Setting | What the family sees | What we submit |
|---|---|---|---|
| 0 | any | No combo | Undecided sentinel (hidden) |
| 1 | any | No combo | That section id (hidden) |
| 2+ | off | No combo | First choosable section id (hidden) |
| 2+ | on | Combo / calendar of those sections | The section(s) they pick |

## Copy

- New keys on `admin.settings` in `en.json` + `es.json` + `pt.json` (toggle label + hint). Spanish: tuteo neutro.
- Keep `sectionUndecidedOption` in dictionaries for admin display of old leads. Do not show it on the public combo.

# Inscripciones — all statuses

**Intent:** Inscripciones has one view that lists every registration, including enrolled.

**Done when:** The inbox chips include "Todos los estados". That chip lists new, contacted, and enrolled rows. Search, section, sort, paging, and export use that same set. The default chip stays "urgent". The home count of leads that need action stays the open set.

**Out of scope:** A matrícula control on the alta. Changing who can accept a lead. A new page.

## Decision

Add `all` to the inscription inbox filters.

- `all` does not apply `.neq("status", "enrolled")` and does not apply an intake filter.
- Every other chip keeps the current exclusion of enrolled rows.
- The chip count for `all` is the exact total for the active search.
- An enrolled row shows the existing "Inscrito" label. Accept stays closed for that status.

## Surfaces (Web vs PWA)

Tier B. A narrow tree exists. The toolbar is shared.

| Surface | Change |
|---|---|
| Web desktop | The new chip is in `RegistrationListToolbar`. The table renders enrolled rows. |
| Narrow / PWA | The same toolbar and the same rows. No new layout. |

## Tests

- `all` returns an enrolled row. `urgent` does not.
- The chip label comes from `en.json`, `es.json`, and `pt.json`.

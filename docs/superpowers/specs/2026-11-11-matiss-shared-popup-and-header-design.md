# Guest home popup and Matiss header links

**Intent:** An approved shared event that is marked for the home popup appears on the guest home, including the Matiss home. The Matiss header offers Blog and Eventos.

**Done when:** The guest home dialog lists that shared event with the same rules as a local popup event. The Matiss home header, on the wide nav and in the phone menu, shows Eventos and shows Blog when the blog is on. Both links open the real pages.

**Out of scope:** A Matiss-only or Liora-only branch. A new popup component. Changing who may share an event. The payment-line commit from the previous task.

## Surfaces (Web vs PWA)

The home popup already mounts on every public home. Liora keeps `HomeEventPopupOrInline`. Every other home, including Matiss, keeps `HomeEventPopup`.

Matiss home is Tier A. The wide tree is `LandingMatissSections`. The narrow tree is `LandingMatissPhoneSections`. Both use `MatissSiteHeader`. Add the two links to that shared link list. Do not add a second header.

## Popup

Today `loadHomeEventPopup` reads only the current database. `show_on_home` on a shared event updates the owner row. The guest home never sees it. That limit is in `docs/superpowers/specs/2026-11-10-shared-events-design.md`.

After this change, the guest home also reads approved grants:

1. Keep the local popup rows.
2. For each approved grant, read the owner event.
3. Keep it when it is published, public, not archived, `show_on_home`, and still upcoming.
4. Drop it when the guest already has a non-archived event with the same slug.
5. Sort by date and keep at most 8, together with the local rows.

The code does not name a tenant.

## Header

Add `landing.matiss.nav.eventos` and `landing.matiss.nav.blog` in `en.json`, `es.json`, and `pt.json`.

On the Matiss home, insert Eventos and Blog before Contacto.

- Eventos goes to `/{locale}/events`.
- Blog goes to `/{locale}/blog` only when `blogEnabled` is true.

The blog screen header already shows both labels, but Eventos points at `/{locale}/eventos`. Point it at `/{locale}/events`.

## Tests

- A shared upcoming event with `show_on_home` is in the guest popup set.
- The same slug on a local non-archived event hides the shared row.
- A shared event with `show_on_home` false stays out.
- The Matiss home link list includes Eventos, and includes Blog only when the blog is on.

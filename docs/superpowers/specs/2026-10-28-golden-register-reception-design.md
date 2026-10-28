# Golden register: reception desk

**Intent:** The classic (Golden) `/register` page must feel like the institute desk, not a leftover landing stack. Desktop: collage + welcome line on one side, the form on a paper sheet on the other. Phone and installed PWA: form only.

**Done when:**

1. `RegisterClassicSurface` on `lg+` is a two-column desk. Left: existing `RegisterCollage` plus `figureTitle` / `figureLead`. Right: `shellTitle` / `shellLead` and `RegisterForm` inside a token sheet (`bg-surface`, hairline `border-border`).
2. Below `lg` the left column is not rendered in the layout (`hidden lg:…`). Header, titles, form, login link, and footer stay. No collage on the phone.
3. `RegisterForm` is unchanged (DNI draft, assigned-section line, submit). No form fork.
4. Copy lives under `landing.classic.register` in `en.json` / `es.json` / `pt.json`. Spanish is tuteo neutro. No kicker, no chips, no icon boxes, no three metric cards.
5. Vitest on `RegisterClassicSurface` asserts shell heading, figure copy, form stub, sheet class, and that the figure column uses the desktop-only visibility class.

**Out of scope:**

- Nago, Liora, Mozarthitos, Mi Mundo, Espacio Zenit surfaces.
- A new Golden font root or a dark hero clone of the home page.
- Changing register actions, settings, or section picker rules.
- A second PWA register tree (`useAppSurface` fork).

## Surfaces (Web vs PWA)

Inspected: `/register` → `RegisterSurfaceByTemplate` → `RegisterClassicSurface`. Shared `RegisterForm`. No `src/components/pwa/**Register*` and no `SurfaceMountGate` on this route.

- **Web (`web-desktop`, `lg+`):** two columns. Collage + figure copy left. Sheet + form right.
- **Web-mobile / PWA-mobile:** same component. Hide the figure column. Form is full width. Touch targets already on `RegisterForm` / header (`≥44px`). Safe-area chrome stays on the existing public header/footer.

Do not add `useAppSurface` only to hide the collage. A `lg` visibility class is enough because the interaction (the form) is the same.

## Layout

- Keep `RegisterSiteHeader` and the muted page wash.
- `lg:grid` two columns, form column slightly wider.
- Extract `RegisterClassicFigure` if the surface would pass 250 lines.
- Login link stays under the form. Icon + dictionary label (`16-admin-buttons-icons`).

## Copy

Keys on `landing.classic.register`:

| Key | Role |
|---|---|
| `shellTitle` | `h1` above the form (trial still uses `register.trial.shellTitle`) |
| `shellLead` | One line under the `h1` |
| `figureTitle` | `h2` on the desktop figure |
| `figureLead` | Quiet sentence under the collage |

Scene first. No “nuestros módulos”. No *vos* / *inscribite*.

## Tests

- New `src/__tests__/organisms/RegisterClassicSurface.test.tsx` (same stub pattern as Nago).
- `RegisterSurfaceByTemplate` mock stays. Shared form tests stay as they are.

## Changelog

Staff and families see the page. Add a `registrations` (or `site`) row in `catalogEntriesNow.ts`.

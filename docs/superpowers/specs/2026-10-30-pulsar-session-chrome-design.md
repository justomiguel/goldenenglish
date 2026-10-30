# Pulsar session chrome

**Intent:** A signed-in person on Centro Listo can sign out from the public header and from every staff screen. Sign-in and sign-out use the Pulsar auth client.

**Done when:**

- The public header shows the email and **Cerrar sesión** when a Pulsar user is signed in.
- The same control is on the fleet, tenant, password, and theme screens.
- Sign-out clears the Pulsar session and returns to `/{locale}`.
- Staff login and owner login call a Pulsar browser client.
- After sign-in, staff land on `/admin` and owners land on `/cuenta`.
- Vitest covers the header states and the sign-out action.

**Out of scope:** Institute `/login`. Password reset. Changing owner approval rules. A full rewrite of the desktop marketing page.

## Root cause

The public chrome (`PulsarSiteChrome`) has a **Control Plane** link. It has no session and no sign-out.

Staff sign-out lives only in `PulsarAdminFleetScreen`, and only when `sessionMode === "pulsar-db"`. Tenant, password, and theme screens have no sign-out.

Owner sign-out lives only at the bottom of `/cuenta`.

`PulsarAdminLoginForm` and `PulsarAccountAuthForm` call the institute `createClient()`. Session read and sign-out use `createPulsarServerClient()`.

## Decision

One session menu. One Pulsar browser client. One sign-out action.

## Surfaces (Web vs PWA)

Tier B for `/admin`. The staff header shows the session menu on a wide or narrow window. There is no second admin tree.

Public Centro Listo pages and `/cuenta` are the conversion path. They had no PWA tree.

- **Web (`web-desktop`):** the current header, plus the session menu.
- **Narrow (`web-mobile` and `pwa-mobile`):** `PulsarSiteChromePwa`. Top safe area. Bottom navigation for La jornada, Cómo funciona, Escuelas, and Conversar. Each target is at least 44px. A thumb-zone button links to `/{locale}/contacto` on every narrow page except Conversar. The floating WhatsApp control stays on the desktop chrome.
- **`/cuenta`:** `PulsarAccountFrame`. Narrow layout uses safe areas, fields at least 44px tall, and a bottom submit on the auth form.

## Behavior

1. `createPulsarBrowserClient()` reads the Pulsar URL and anon key already injected on Pulsar pages. It does not bind an institute schema.
2. `signOutPulsarSessionAction(locale)` calls `createPulsarServerClient().auth.signOut()`, revalidates `/{locale}` and `/{locale}/admin`, and the client sends the person to `/{locale}`.
3. `PulsarSessionMenu` receives `{ email: string } | null`.
   - Signed in: email plus **Cerrar sesión**.
   - Signed out: **Ingresar** links to `/{locale}/cuenta/login`.
4. `PulsarSiteChrome` renders that menu in the desktop header and in the mobile nav.
5. `PulsarAdminChrome` wraps fleet, new tenant, edit tenant, password, and theme pages. It always shows the menu, including `dev-local`. In `dev-local` the next visit to `/admin` opens the fleet again, because that mode has no cookie. The button still leaves the screen.
6. `/admin/login` redirects to `/cuenta/login?next=/{locale}/admin`.
7. After a successful sign-in, the server sends staff to `/admin` (or the password screen) and owners to `/cuenta`. A same-origin `next` path is allowed only when it starts with `/{locale}/`.
8. Copy lives in `pulsar.session` in `en.json` and `es.json`. Spanish uses tuteo: **Cerrar sesión**, **Ingresar**.

## Options considered

Keep two login forms and add a sign-out button only on the fleet header. Rejected. The person who is on the public site still cannot leave the session, and the two clients stay split.

## Consequences

- ADR `docs/adr/2026-10-30-pulsar-session-chrome.md` records the auth client change.
- Tests: chrome signed-in vs signed-out; sign-out action calls the Pulsar client; login form uses the Pulsar browser client.
- Manual QA (user): sign in as staff, open `/es`, sign out, confirm `/es/admin` asks for sign-in again. Repeat as owner from `/cuenta`.

## Test plan

- `PulsarSiteChrome` shows sign-out when `session.email` is set, and **Ingresar** when it is null.
- `signOutPulsarSessionAction` calls Pulsar `signOut` and revalidates.
- Owner and staff login modules construct `createPulsarBrowserClient`, not the institute client.

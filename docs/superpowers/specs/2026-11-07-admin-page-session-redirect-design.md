# Admin pages redirect when the session is missing

**Intent:** A GET to an admin events page with no Supabase user must redirect to login. It must not throw `ADMIN_SESSION_UNAUTHORIZED` into `onRequestError`.

**Done when:**

- `requireAdminPage` in `src/lib/dashboard/requireAdminPage.ts` calls `assertAdmin`.
- On `ADMIN_SESSION_UNAUTHORIZED` it redirects to `/${locale}/login?next=/${locale}/dashboard/admin`.
- On `ADMIN_SESSION_FORBIDDEN` it redirects to `/${locale}`.
- Any other error is rethrown.
- These pages call `requireAdminPage` after they have `locale`: `events/page.tsx`, `events/new/page.tsx`, `events/[eventId]/page.tsx`.
- Vitest locks the two redirect codes and the rethrow path.
- `assertAdmin` still throws those codes for actions and route handlers.

**Out of scope:** Rewriting pages that already catch the codes. Changing action or API 401 responses. Cookie domain between `www` and the apex host.

## Surfaces (Web vs PWA)

Tier B. Admin events screens are desktop-only. No PWA tree reads these pages. Shared `assertAdmin` stays a throw so actions and routes keep their current responses.

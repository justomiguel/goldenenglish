# Birthday card avatars — signed display URL

## Intent

The admin home at `/es/dashboard/admin` crashes when a birthday row has a profile photo. `profiles.avatar_url` stores an object path in the private `avatars` bucket (`{userId}/{file}.jpg`). `loadDashboardBirthdaysCard` copies that path onto the card. `ProfileAvatar` passes it to `next/image`. Next throws `Failed to construct 'URL'` and the page error boundary replaces the hub.

## Done when

- Birthday cards resolve each `avatar_url` with `resolveAvatarDisplayUrl` before render.
- A storage path never reaches `next/image`.
- A path that cannot be signed shows the default avatar icon.
- `ProfileAvatar` treats a non-display src as no photo, so one bad value does not take down the page.
- Tests lock the signed-URL path and the invalid-src fallback.

## Out of scope

- Changing how avatars are uploaded or stored.
- Public bucket policy.
- Other screens that already call `resolveAvatarDisplayUrl`.

## Surfaces (Web vs PWA)

Tier B admin home and the teacher home use `UpcomingBirthdaysCard`. The student dashboard (Tier A) uses the same loader and the same `ProfileAvatar` atom. This change is in the loader and the atom. No layout split. Web and PWA both receive a display URL or null.

## Plan

1. In `loadBirthdayCardDetails`, map each `avatar_url` through `resolveAvatarDisplayUrl` in parallel.
2. In `ProfileAvatar`, render `Image` only for `http:`, `https:`, `/…`, `blob:`, or `data:`. Any other string uses the default icon.
3. Tests: birthday loader signs a storage path; `ProfileAvatar` falls back on a storage path and still renders an https src.

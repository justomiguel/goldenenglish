# Birthday card avatars — signed display URL

Spec: `docs/superpowers/specs/2026-11-10-birthday-avatar-signed-url-design.md`

1. `loadBirthdayCardDetails` signs each `avatar_url` with `resolveAvatarDisplayUrl`.
2. `ProfileAvatar` renders `Image` only for a display src. A storage path uses the default icon.
3. Tests cover the signed path and the invalid-src fallback.

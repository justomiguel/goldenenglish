# Event registration failure copy

1. Map Zod issues to stable codes in `POST /api/events/[slug]/enroll`.
2. Map those codes, and a non-success `resultCode`, to `events.register.errors` in the submit hook.
3. Treat blank tutor strings as missing so a minor gets the tutor sentence.
4. Cover the map and the hook with Vitest. Add the changelog entry.

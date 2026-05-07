# ADR — Optional `profiles.dni_or_passport` for admin-created users

## Context

Admin quick user creation required ID and phone fields; Postgres enforced non-empty `dni_or_passport` and a global unique index. Operators need to create roles without immediate ID/phone and clearer failure messages.

## Decision

1. Migrate `profiles.dni_or_passport` to **nullable**, drop non-empty CHECK, replace the unique index with a **partial** unique index on non-empty trimmed values.
2. Update `handle_new_user()` to persist **NULL** when metadata has no document (remove synthetic `pending-{uuid}` fallback for new inserts).
3. Application: optional DNI/phone on `createDashboardUser`; institute default password `educando2026` when password left empty; richer Zod + Supabase-auth error messaging.

## Consequences

- Multiple users may have **NULL** document until staff completes profiles; uniqueness still applies whenever a document is supplied.
- Search/import flows assuming every row has DNI must treat NULL explicitly (already common for nullable columns in UI types).
- **Follow-up:** consider profile completion prompts for NULL document where business requires it.

## Options considered

- **Synthetic placeholder per user** (e.g. `pending-{uuid}`) — avoids migration but pollutes identifiers and search; rejected.
- **Keep NOT NULL + only UX optional** — would still fail at upsert; rejected.

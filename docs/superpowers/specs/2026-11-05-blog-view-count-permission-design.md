# Blog view count permission

**Intent:** A public blog view on Mozarthitos must increment `view_count`. The server log must name the host and the tenant.

**Done when:**

- `increment_blog_article_view_count` adds 1 to a published article without the staff update trigger.
- The app does not `UPDATE blog_articles` as `anon`.
- A server log line includes `host` and `tenantSlug` from the request headers.
- Vitest covers the RPC path and the async header reader.

**Out of scope:** Granting `UPDATE` on `blog_articles` to `anon`. Event view counts. A new admin screen.

## Cause

1. `blog_articles_validate_transitions` rejects every update when `auth.uid()` is not staff. The view RPC is `SECURITY DEFINER`, but `auth.uid()` stays the caller. An anonymous read raises `blog_update_forbidden`.
2. The TypeScript fallback then updates the table as `anon`. Migration `187` revoked that privilege. PostgREST returns `42501` and suggests `GRANT UPDATE ... TO anon`.
3. Next.js 16 `headers()` returns a Promise. A reader that checks `.get` on that Promise gets null. A log meta object with `host: null` then replaces any value the reader did find. Every `[ge:server]` line can print `host: null`.

## Decision

- Set a transaction-local flag inside the view RPC. The staff trigger and the `updated_at` trigger return early when that flag is set.
- Count only a published article whose `published_at` is already due.
- Delete the table update fallback. Log the RPC error.
- Every `[ge:server]` line reads `headers()` itself when the registered reader is empty.
- A null `host` or `tenantSlug` in meta does not erase a value already read from the request or from the active institute.

## Surfaces (Web vs PWA)

Tier A public article page. No layout change. Web and PWA use the same server page. Shared hooks and props stay the same.

## Manual QA (user)

Open one published Mozarthitos article twice. The first view increases the count. The second view inside 30 minutes does not. The server log shows the Mozarthitos host and slug.

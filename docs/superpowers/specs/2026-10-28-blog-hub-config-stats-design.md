# Blog hub: visibility, comments, and stats

**Date:** 2026-10-28
**Status:** Approved (2026-10-28)
**Kind:** Design spec. Implementation plan after this file is approved.

**Related:**

- Blog CMS: `supabase/migrations/144_blog_cms_initial.sql`
- Admin list: `src/app/[locale]/dashboard/admin/cms/blog/page.tsx`
- Public article: `src/app/[locale]/blog/[slug]/page.tsx`
- Comment hook: `src/hooks/useBlogComments.ts`
- Tabs: `src/hooks/usePersistentPageTab.ts` (`.cursor/rules/42-persistent-page-tabs.mdc`)

**Governing rules:** `03-architecture.mdc`, `05-pwa-mobile-native.mdc`, `09-i18n-copy.mdc`, `40-neutral-spanish-copy.mdc`, `02-testing-tdd.mdc`, `08-analytics-observability.mdc`, `10-engineering-governance.mdc`, `12-supabase-app-boundaries.mdc`, `17-trust-boundary-handlers.mdc`, `25-server-error-logging.mdc`, `27-post-mutation-ui-refresh.mdc`.

**ADR:** required. File `docs/adr/2026-10-28-blog-visibility-comments-stats.md` ships in the same implementation commit. This spec is the source. The ADR copies Context, Decision, Options, and Consequences.

## Intent

Staff run the blog from one hub with three tabs: articles, config, and stats. Each article is public or limited to signed-in accounts. Comments follow a global switch, a guest switch, and the existing per-article switch. Stats show reading, call-to-action clicks, and approved comments for the last 30 days.

## Decisions

| Topic | Choice |
|-------|--------|
| Approach | `site_settings` keys, article columns, a guest-email table, and a metrics event table. |
| Existing articles | `visibility = public`. Current public URLs stay public. |
| Signed-in comments | Stay visible on insert when comments are allowed. |
| Guest comments | Name and email. Status starts at `pending`. Email is stored off the public row. Admin and assistant read it. |
| Guest default | Off. Today only accounts can comment. |
| Comments default | On, matching `comments_enabled` today. |
| Call to action | Optional label and URL on each translation. Both empty, or both set. |
| Stats window | Last 30 days. Reading is the primary number. |
| All-time views | Keep `view_count` on the article. The stats tab uses the event table. |
| Config editors | Admin and assistant (`blog_user_can_review`). |
| Article fields | Assistant and admin set visibility, per-article comments, and the call to action on any article. A teacher sets them only on their own article while it is draft, in review, or scheduled. Published and archived articles stay assistant and admin, same as the editor today. |

## Surfaces (Web vs PWA)

Public blog is **Tier A**. Trees already exist:

- Web: `src/components/desktop/organisms/BlogIndexDesktop.tsx`, `BlogArticleDetailDesktop.tsx`
- PWA / mobile: `src/components/pwa/organisms/BlogIndexMobile.tsx`, `BlogArticleDetailMobile.tsx`
- Switch: `BlogIndexSurfaceEntry.tsx`, `BlogArticleDetailSurfaceEntry.tsx`

Shared loaders and actions enforce visibility before either tree renders. A protected article never sends title or body to an anonymous response.

**Web (`web-desktop`):** the call to action is a button under the body. The guest form is inline under the comments list. Targets stay at least 44px where they are primary.

**PWA (`web-mobile` and `pwa-mobile`):** the call to action is a full-width button in the thumb zone. The guest form opens in a sheet. Touch targets are at least 44px. Safe areas stay on the existing public shell.

**Admin:** Tier B, desktop only. No new PWA tree. The hub lives on `/[locale]/dashboard/admin/cms/blog`. Narrow viewports scroll. Shared molecules used by the public PWA keep their current props. New fields arrive as optional props with a default that matches today (`public`, comments follow the article flag, no call to action).

## Data model

Additive migration only. No `DROP`, no mass `DELETE`.

**`site_settings` keys** (json booleans, same pattern as `blog_enabled`):

- `blog_comments_enabled` default `true`
- `blog_guest_comments_enabled` default `false`

`blog_enabled` stays. The config tab edits all three.

**`blog_articles`:**

- `visibility text not null default 'public'` check (`public`, `members`)

`comments_enabled` already exists.

**`blog_article_translations`:**

- `cta_label text null`
- `cta_url text null`
- Check: both null, or both non-empty. `cta_label` max 80 characters. `cta_url` is `http:`, `https:`, or a site path that starts with `/`.

**`blog_comment_status`:** add `pending`.

**`blog_article_comments`:**

- `author_id` becomes nullable
- `guest_display_name text null` (max 80)
- Check: account comment (`author_id` set, `guest_display_name` null) or guest comment (`author_id` null, `guest_display_name` set)
- Guest insert status is `pending`. Account insert status is `visible`.

**`blog_comment_guest_emails`:**

- `comment_id` primary key, references the comment, cascade delete
- `email text not null`
- Select and insert for reviewers only (`blog_user_can_review`)
- No policy for `anon` or for other authenticated users

The public comment query never selects this table.

**`blog_article_metrics`:**

- `id uuid`
- `article_id uuid null` (null only for `list_view`)
- `kind text` check (`list_view`, `article_view`, `cta_click`)
- `source text null` check (`index`, `other`) for `article_view`
- `day date not null`
- `dedupe_key text not null unique`
- `created_at timestamptz`
- No user id, no email, no IP

`dedupe_key` is a hash of kind, article id, source, UTC day, and a random visitor id from cookie `ge_blog_vid`. One row per browser per day per event. A repeat visit the same day does not add a second row.

Inserts go through one security-definer RPC. `anon` and `authenticated` may execute it. They may not select the table. Staff read aggregates through a second RPC. Grant execute on the aggregate to authenticated reviewers only.

## Access rules

**Read**

- Anonymous list, sitemap, and detail include published articles with `visibility = public` only.
- A signed-in user also sees published `members` articles in the list and on the detail page.
- An anonymous request for a `members` slug redirects to login and returns to that path. The response has no title and no body.
- Staff preview routes stay as they are.

**Comments**

A comment insert is allowed only when the article is published, `blog_comments_enabled` is true, and `comments_enabled` is true.

- Account comment: any signed-in user, on `public` or `members`.
- Guest comment: anonymous, only when `blog_guest_comments_enabled` is true and `visibility = public`.
- Guest insert is a server action. The action writes the comment as `pending` and the email row with the admin client. The browser cannot insert a guest row or choose `visible`.
- Direct client insert remains for account comments and must keep `author_id = auth.uid()` and status `visible`. RLS rejects guest-shaped rows from the client.

**Call to action click**

The metrics RPC accepts `cta_click` only when the published translation for that locale has both label and URL.

**Config**

Only admin and assistant update the three setting keys. The action writes `recordSystemAudit` with the key names and boolean values. The payload has no email.

## Admin UI

One page. `usePersistentPageTab` with query key `tab`.

| Tab id | Who | Content |
|--------|-----|---------|
| `articles` | Admin, assistant, teacher | Current article list, plus a public / members badge. |
| `config` | Admin, assistant | Three switches: blog visible, comments, guest comments. Save button. |
| `stats` | Admin, assistant | 30-day reading total, list-to-article rate, call-to-action rate, comment rate, and a per-article table. |

Unknown `tab` values fall back to `articles`. A teacher who opens `config` or `stats` lands on `articles`.

The article editor gains visibility, the existing comments switch (wired in the UI), and per-locale call-to-action label and URL.

Comment moderation stays on `/cms/blog/comments`. Pending guest rows show display name, email, and an approve action. Approve sets status to `visible`. Hide and flag stay.

Copy lives in `en.json`, `es.json`, and `pt.json`. Spanish uses neutral tuteo.

After a successful save, the action calls `revalidatePath` for the admin blog page and the public blog routes. The client calls `router.refresh()`.

## Public UI

- Index cards for `members` articles render only for a signed-in reader.
- Detail shows the call-to-action button when that locale has a label and a URL. The click records `cta_click`, then navigates.
- Comments block hides when the global switch is off or the article switch is off.
- Guest form shows when the viewer is anonymous, the article is public, and guest comments are on. Fields: display name and email. Submit copy says the comment waits for review.
- A signed-in viewer gets the current comment box on public and members articles when comments are on.
- The public comment list never shows `pending` comments. It shows `guest_display_name` on an approved guest comment. It never shows the email.

Web and PWA both use these rules. Layout differs as in Surfaces.

## Metrics

Window: `created_at >= now() - 30 days`.

| Figure | Formula | Empty |
|--------|---------|-------|
| Reading (primary) | Count of `article_view` | 0 |
| List to article | `article_view` with `source = index` / `list_view` | Em dash when `list_view` is 0 |
| Call to action | `cta_click` / `article_view`, articles that have a call to action only | Em dash when the article has no call to action, or when views are 0 |
| Comments | New `visible` comments / `article_view` | Em dash when views are 0 |

The per-article table sorts by reading, descending. `pending` comments are not in the comment rate.

`list_view` is recorded once per index page load per browser per day. Index cards link to the article with `?from=index`. The article page records `source = index` when that param is present, then removes it from the URL. Other entries use `other`.

The client posts to `POST /api/blog/metrics`. The route sets cookie `ge_blog_vid` when it is missing. The cookie is `HttpOnly`, `SameSite=Lax`, and holds only a random id. The body is `{ kind, articleId, source, locale }`. The response is `{ ok: true }` or a stable error code. `Cache-Control: private, no-store`. The route does not read a secret from the query string.

## Errors

- Save rejects a call to action when one of label or URL is empty, or when the URL scheme is not allowed.
- Guest action rejects a missing name, a missing email, or an invalid email. It returns a stable code. The client maps the code through the dictionary.
- Guest action rejects when comments are off, guests are off, or the article is `members`.
- The metrics RPC no-ops when the article is missing, not public to that caller, or the click has no call to action. It still returns success so the page does not break.
- Failed Supabase writes log with `[ge:server]` and a stable scope. Logs omit email and comment body.
- Guest email is not written to `user_events`, audit payload, or client analytics metadata.

## Governance

**Context.** The blog is public by default. Comments require an account. Staff cannot set visibility, guest comments, or a reading funnel in one place.

**Decision.** Per-article visibility, global comment switches, moderated guest comments with email isolated from the public row, and a 30-day metrics table behind reviewer RPCs.

**Options rejected.** A single JSON blob plus `user_events` misses anonymous readers. A full analytics product (date ranges, unique visitors, campaigns) is a later project.

**Consequences.** RLS and a new enum value. An ADR file. Tests below. Config changes are audited. Guest email is reviewer-only.

## Tests

Pure modules, no Supabase:

- Visibility filter for anonymous and signed-in lists.
- Comment eligibility matrix (global, guest, per-article, visibility, session).
- Call-to-action pair and URL checks.
- Metric formulas, including em dash when the denominator is 0.

Action and route tests, Supabase mocked:

- Guest action writes `pending` and does not return the email to the client.
- Account insert path rejects a guest-shaped payload.
- Config action denies teachers and audits a successful save.
- Metrics route sets the cookie, rejects a click without a call to action, and sends `Cache-Control: private, no-store`.

UI tests:

- Hub restores `tab` from the URL.
- Teacher shell does not render config or stats.
- Public detail hides the guest form when guests are off, and hides the body fields when the test fixture is anonymous on a members article.
- PWA detail renders the call to action as a full-width control. Web detail renders the inline form.

Each new test file is self-contained.

## Out of scope

- Date-range picker, unique visitors, and campaign tags.
- Guest comments on `members` articles.
- Holding account comments for moderation.
- Counting every external link in the article body.
- A new PWA admin shell.

## Done when

- The hub tabs match this spec for admin, assistant, and teacher.
- Anonymous readers cannot read a `members` article.
- Guest comments stay `pending` until a reviewer approves them, and only reviewers see the email.
- The stats tab shows the four figures for 30 days.
- Vitest covers the matrix above.
- Dictionaries `en`, `es`, and `pt` include the new strings. Spanish is tuteo.
- The ADR file exists and matches the Governance section.

## Manual QA (user)

- Publish one public article and one members article. Open both signed out and signed in.
- Turn guest comments on. Submit a guest comment. Confirm it is hidden, the email shows in moderation, and approve makes the name public.
- Save a call to action. Click it. Confirm the stats row moves after refresh.
- Open the hub, switch tabs, reload, and confirm the same tab returns.

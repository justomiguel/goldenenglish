# Blog hub config and stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff get one blog hub with articles, config, and 30-day stats, and each article can be public or limited to signed-in accounts.

**Architecture:** Pure rules decide visibility, comment eligibility, call-to-action pairs, and stat rates. Postgres stores the columns, the guest email table, and the metric events. Server actions and one metrics route enforce the rules. The admin hub is desktop-only. The public blog keeps its web and PWA trees.

**Tech Stack:** Next.js App Router, React, Tailwind tokens, Vitest, Supabase Postgres RLS, `usePersistentPageTab`.

**Spec:** `docs/superpowers/specs/2026-10-28-blog-hub-config-stats-design.md`

## Global Constraints

- Stay on `main`. Do not create a branch, worktree, or stash.
- Do not commit per task. One commit at the end holds the spec, this plan, the ADR, and the code. Do not push.
- If the tree has other WIP, stop and ask before that commit.
- Files stay at or under 250 lines. One main export per component file.
- New user-facing strings go in `src/dictionaries/en.json`, `es.json`, and `pt.json` in the same task. Spanish is neutral tuteo.
- No `alert`, `confirm`, or `prompt`.
- Buttons that show text get a leading Lucide icon at `h-4 w-4` with `aria-hidden`.
- Server failures log with `[ge:server]` and a stable scope. Logs omit email and comment body.
- After a successful mutation, the action calls `revalidatePath` and the client calls `router.refresh()`.
- Admin blog is Tier B. Do not add a PWA admin tree.
- Public blog is Tier A. Change desktop and PWA trees in the same task. Selection stays on `useAppSurface` / the existing surface entries.
- Do not put the guest email in `user_events`, audit payloads, or client analytics.
- Out of scope: date pickers, unique visitors, campaigns, guest comments on members articles, moderating account comments before they show, counting body links, a PWA admin shell.
- Tests live in `src/__tests__/` and run alone. Mock Supabase at the boundary.
- `supabase/migrations/masterdb.sql` is regenerated. Do not hand-edit it. Command: `node scripts/generate-masterdb-from-migrations.mjs`.

---

## File map

| File | Job |
|------|-----|
| `src/lib/blog/articleVisibility.ts` | `public` or `members`, and who may read. |
| `src/lib/blog/commentEligibility.ts` | Whether this viewer may comment, and the insert status. |
| `src/lib/blog/ctaFields.ts` | Label and URL pair. |
| `src/lib/blog/metricFormulas.ts` | 30-day rates. Null means em dash. |
| `src/lib/blog/domain.ts` | Add `pending`, `visibility`, guest name, CTA fields. |
| `supabase/migrations/229_blog_visibility_comments_metrics.sql` | Schema, RLS, RPCs. |
| `src/lib/blog/server/loadPublishedArticles.ts` | Pass `includeMembers`. |
| `src/app/sitemap.ts` | Public slugs only. |
| `src/app/[locale]/blog/[slug]/page.tsx` | Redirect anonymous members reads. |
| `src/components/dashboard/admin/cms/blog/BlogHub.tsx` | Tabs. |
| `src/components/dashboard/admin/cms/blog/BlogConfigPanel.tsx` | Three switches. |
| `src/components/dashboard/admin/cms/blog/BlogStatsPanel.tsx` | Four figures and the table. |
| `src/app/api/blog/metrics/route.ts` | Cookie and event insert. |
| `src/components/blog/BlogMetricBeacon.tsx` | Posts one event on mount. |
| `docs/adr/2026-10-28-blog-visibility-comments-stats.md` | Governance copy from the spec. |

---

### Task 1: Pure rules

**Files:**

- Create: `src/lib/blog/articleVisibility.ts`
- Create: `src/lib/blog/commentEligibility.ts`
- Create: `src/lib/blog/ctaFields.ts`
- Create: `src/lib/blog/metricFormulas.ts`
- Modify: `src/lib/blog/domain.ts`
- Test: `src/__tests__/lib/blog/articleVisibility.test.ts`
- Test: `src/__tests__/lib/blog/commentEligibility.test.ts`
- Test: `src/__tests__/lib/blog/ctaFields.test.ts`
- Test: `src/__tests__/lib/blog/metricFormulas.test.ts`

**Interfaces:**

- Consumes: nothing new.
- Produces:

```ts
export type BlogVisibility = "public" | "members";

export function canReadBlogArticle(input: {
  visibility: BlogVisibility;
  isSignedIn: boolean;
}): boolean;

export type CommentInsertKind = "account_visible" | "guest_pending" | "denied";

export function commentInsertKind(input: {
  commentsGloballyEnabled: boolean;
  guestCommentsEnabled: boolean;
  articleCommentsEnabled: boolean;
  visibility: BlogVisibility;
  isSignedIn: boolean;
}): CommentInsertKind;

export function parseCtaFields(input: {
  label: string | null | undefined;
  url: string | null | undefined;
}): { ok: true; label: string | null; url: string | null } | { ok: false; code: "cta_incomplete" | "cta_url" };

export function blogStatsRates(input: {
  articleViews: number;
  indexArticleViews: number;
  listViews: number;
  articles: Array<{
    articleId: string;
    views: number;
    ctaClicks: number;
    visibleComments: number;
    hasCta: boolean;
  }>;
}): {
  reading: number;
  listToArticle: number | null;
  ctaRate: number | null;
  commentRate: number | null;
  rows: Array<{
    articleId: string;
    reading: number;
    ctaRate: number | null;
    commentRate: number | null;
  }>;
};
```

- [ ] **Step 1: Write the failing tests**

`articleVisibility.test.ts` asserts `canReadBlogArticle({ visibility: "members", isSignedIn: false })` is false, and the same call with `isSignedIn: true` is true. `public` is true for both.

`commentEligibility.test.ts` covers this matrix:

| global | guest | article | visibility | signed in | result |
|--------|-------|---------|------------|-----------|--------|
| false | true | true | public | false | denied |
| true | false | true | public | false | denied |
| true | true | false | public | false | denied |
| true | true | true | members | false | denied |
| true | true | true | public | false | guest_pending |
| true | false | true | members | true | account_visible |
| true | false | true | public | true | account_visible |

`ctaFields.test.ts`:

- both empty strings become `{ ok: true, label: null, url: null }`
- label set and url empty is `{ ok: false, code: "cta_incomplete" }`
- `javascript:alert(1)` is `{ ok: false, code: "cta_url" }`
- `https://example.com/a` and `/register` are ok with trimmed values
- label longer than 80 characters is `{ ok: false, code: "cta_incomplete" }`

`metricFormulas.test.ts`:

- views 0 yields `listToArticle`, `ctaRate`, and `commentRate` as null, and `reading` 0
- 10 index article views and 40 list views yield `listToArticle` 0.25
- CTA rate uses only rows with `hasCta: true`
- a row with `hasCta: false` has `ctaRate: null`
- rows sort by `reading` descending
- comment rate is `visibleComments / views` for the site and for each row with views above 0

Add at the top of each test file:

```ts
// REGRESSION CHECK: Blog visibility, guest comments, and 30-day rates must stay aligned with the 2026-10-28 spec.
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run src/__tests__/lib/blog/articleVisibility.test.ts src/__tests__/lib/blog/commentEligibility.test.ts src/__tests__/lib/blog/ctaFields.test.ts src/__tests__/lib/blog/metricFormulas.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the four modules and extend `domain.ts`**

`BLOG_COMMENT_STATUSES` becomes `["visible", "hidden", "flagged", "pending"]`.

Add to `BlogArticle`: `visibility: BlogVisibility`.

Add to `BlogArticleTranslation`: `ctaLabel: string | null` and `ctaUrl: string | null`.

Add to `BlogArticleComment`: `authorId: string | null` and `guestDisplayName: string | null`.

`canReadBlogArticle` returns true when visibility is `public` or `isSignedIn` is true.

`commentInsertKind` returns `denied` unless global comments, article comments, and (signed in or guest-on public) all hold. Signed in returns `account_visible`. Anonymous public with guests on returns `guest_pending`.

`parseCtaFields` trims. Both empty is a null pair. One side empty is `cta_incomplete`. A set URL must start with `https://`, `http://`, or `/` and must not start with `//`. Label max is 80.

`blogStatsRates` uses integer counts. A rate is null when its denominator is 0. Site CTA denominator is the sum of `views` where `hasCta` is true. Site comment denominator is `articleViews`. Sort rows with `toSorted` by `reading` descending.

- [ ] **Step 4: Run the tests and confirm they pass**

Run the same `npx vitest run` command.

Expected: PASS.

Do not commit.

---

### Task 2: Migration 229

**Files:**

- Create: `supabase/migrations/229_blog_visibility_comments_metrics.sql`
- Modify: `supabase/migrations/masterdb.sql` via `node scripts/generate-masterdb-from-migrations.mjs`

**Interfaces:**

- Consumes: Task 1 names `public`, `members`, `pending`.
- Produces: columns and RPCs `record_blog_metric(p_kind text, p_article_id uuid, p_source text, p_dedupe_key text)` and `blog_admin_stats_30d()`.

- [ ] **Step 1: Add the migration**

The file is additive. It does not drop tables or delete rows.

```sql
ALTER TABLE public.blog_articles
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

ALTER TABLE public.blog_articles
  DROP CONSTRAINT IF EXISTS blog_articles_visibility_check;

ALTER TABLE public.blog_articles
  ADD CONSTRAINT blog_articles_visibility_check
  CHECK (visibility IN ('public', 'members'));

ALTER TABLE public.blog_article_translations
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_url text;

ALTER TABLE public.blog_article_translations
  DROP CONSTRAINT IF EXISTS blog_article_translations_cta_pair;

ALTER TABLE public.blog_article_translations
  ADD CONSTRAINT blog_article_translations_cta_pair
  CHECK (
    (cta_label IS NULL AND cta_url IS NULL)
    OR (
      cta_label IS NOT NULL
      AND char_length(trim(cta_label)) BETWEEN 1 AND 80
      AND cta_url IS NOT NULL
      AND char_length(trim(cta_url)) > 0
    )
  );

ALTER TYPE public.blog_comment_status ADD VALUE IF NOT EXISTS 'pending';

ALTER TABLE public.blog_article_comments
  ALTER COLUMN author_id DROP NOT NULL;

ALTER TABLE public.blog_article_comments
  ADD COLUMN IF NOT EXISTS guest_display_name text;

ALTER TABLE public.blog_article_comments
  DROP CONSTRAINT IF EXISTS blog_article_comments_author_shape;

ALTER TABLE public.blog_article_comments
  ADD CONSTRAINT blog_article_comments_author_shape
  CHECK (
    (author_id IS NOT NULL AND guest_display_name IS NULL)
    OR (
      author_id IS NULL
      AND guest_display_name IS NOT NULL
      AND char_length(trim(guest_display_name)) BETWEEN 1 AND 80
    )
  );

CREATE TABLE IF NOT EXISTS public.blog_comment_guest_emails (
  comment_id uuid PRIMARY KEY REFERENCES public.blog_article_comments(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (char_length(trim(email)) BETWEEN 3 AND 320)
);

ALTER TABLE public.blog_comment_guest_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_comment_guest_emails_reviewer ON public.blog_comment_guest_emails;
CREATE POLICY blog_comment_guest_emails_reviewer
  ON public.blog_comment_guest_emails
  FOR ALL TO authenticated
  USING (public.blog_user_can_review(auth.uid()))
  WITH CHECK (public.blog_user_can_review(auth.uid()));

CREATE TABLE IF NOT EXISTS public.blog_article_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NULL REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('list_view', 'article_view', 'cta_click')),
  source text NULL CHECK (source IS NULL OR source IN ('index', 'other')),
  day date NOT NULL,
  dedupe_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (kind = 'list_view' AND article_id IS NULL AND source IS NULL)
    OR (kind = 'article_view' AND article_id IS NOT NULL AND source IS NOT NULL)
    OR (kind = 'cta_click' AND article_id IS NOT NULL AND source IS NULL)
  )
);

ALTER TABLE public.blog_article_metrics ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.blog_article_metrics FROM anon, authenticated;
```

Replace `blog_articles_select_published` so anonymous readers only get `visibility = 'public'`, and signed-in readers also get `members`. Keep the published and `published_at <= now()` checks. Repeat that visibility predicate inside `blog_article_translations_select_published`.

Replace `blog_comments_insert_authenticated` so the check also requires `author_id = auth.uid()`, `guest_display_name IS NULL`, `status = 'visible'`, `comments_enabled`, and a `site_settings` row `blog_comments_enabled` whose value is not the jsonb `false`.

Insert the two setting keys if missing:

```sql
INSERT INTO public.site_settings (key, value)
VALUES ('blog_comments_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES ('blog_guest_comments_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
```

`record_blog_metric` is `SECURITY DEFINER`, `search_path = public`. It inserts one row and ignores unique violations on `dedupe_key`. It returns without insert when:

- kind is `list_view` and `p_article_id` is not null
- kind is not `list_view` and the article is not published
- the caller is anonymous and the article visibility is `members`
- kind is `cta_click` and no translation of that article has both `cta_label` and `cta_url`

Grant execute to `anon` and `authenticated`.

`blog_admin_stats_30d` is `SECURITY DEFINER`. It returns no rows unless `blog_user_can_review(auth.uid())`. The jsonb shape is:

```json
{
  "articleViews": 0,
  "indexArticleViews": 0,
  "listViews": 0,
  "articles": [
    {
      "articleId": "uuid",
      "views": 0,
      "ctaClicks": 0,
      "visibleComments": 0,
      "hasCta": false
    }
  ]
}
```

Counts use `created_at >= now() - interval '30 days'`. `visibleComments` counts comments with status `visible` in that window. `hasCta` is true when any translation has both CTA columns set. Grant execute to `authenticated` only.

- [ ] **Step 2: Regenerate the context dump**

Run: `node scripts/generate-masterdb-from-migrations.mjs`

Expected: the command exits 0 and `masterdb.sql` contains `blog_article_metrics`.

Do not commit.

---

### Task 3: Readers see the right articles

**Files:**

- Modify: `src/lib/blog/server/types.ts`
- Modify: `src/lib/blog/server/loadPublishedArticles.ts`
- Modify: `src/lib/blog/server/loadRelatedArticles.ts`
- Modify: `src/lib/blog/server/loadArticleBySlug.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/[locale]/blog/page.tsx`
- Modify: `src/app/[locale]/blog/search/page.tsx`
- Modify: `src/app/[locale]/blog/tag/[tag]/page.tsx`
- Modify: `src/app/[locale]/blog/rss.xml/route.ts`
- Modify: `src/lib/parent/loadParentHomeNewsFeed.ts`
- Test: `src/__tests__/lib/blog/loadPublishedArticles.visibility.test.ts`

**Interfaces:**

- Consumes: `canReadBlogArticle` from Task 1. `visibility` column from Task 2.
- Produces: `loadPublishedArticles(supabase, input)` reads `input.includeMembers?: boolean`. Default false. The select list includes `visibility`. `mapArticleRow` sets `visibility`.

- [ ] **Step 1: Write the failing loader test**

Mock the Supabase query builder. When `includeMembers` is omitted, the test expects `.eq("visibility", "public")`. When `includeMembers` is true, the test expects that filter to be absent. The mapped row includes `visibility: "public"`.

- [ ] **Step 2: Run it and confirm FAIL**

Run: `npx vitest run src/__tests__/lib/blog/loadPublishedArticles.visibility.test.ts`

- [ ] **Step 3: Implement**

Add `visibility` to `BlogArticleRowFromDb` and to `ARTICLE_COLUMNS` in `loadArticleBySlug.ts`. `mapArticleRow` copies `row.visibility` only when it is `public` or `members`. Any other value becomes `public`.

`loadPublishedArticles` adds `.eq("visibility", "public")` unless `includeMembers` is true.

`loadRelatedArticles` uses the same flag, default false.

Callers:

- `src/app/[locale]/blog/page.tsx`, search, tag, and `rss.xml` pass `includeMembers: Boolean(user)`.
- `loadParentHomeNewsFeed` passes `includeMembers: true` because the parent is signed in.
- `sitemap.ts` adds `.eq("blog_articles.visibility", "public")` next to the published filters.

- [ ] **Step 4: Run the test and confirm PASS**

Do not commit.

---

### Task 4: Anonymous members article redirects to login

**Files:**

- Modify: `src/app/[locale]/blog/[slug]/page.tsx`
- Test: `src/__tests__/app/blogArticleMembersGate.test.ts`

**Interfaces:**

- Consumes: `canReadBlogArticle`.
- Produces: the page calls `redirect(`/${locale}/login?next=...`)` before it renders title or body when the article is `members` and there is no user. `next` is the article path.

- [ ] **Step 1: Write the failing test**

Extract the decision into a pure helper in `articleVisibility.ts`:

```ts
export function membersArticleRedirectPath(input: {
  locale: string;
  slug: string;
  visibility: BlogVisibility;
  isSignedIn: boolean;
}): string | null;
```

The test expects `"/es/login?next=%2Fes%2Fblog%2Fmarzo"` for an anonymous members article, and `null` for a public article and for a signed-in members article.

- [ ] **Step 2: Run the test and confirm FAIL**

Run: `npx vitest run src/__tests__/lib/blog/articleVisibility.test.ts`

Put the new cases in the existing Task 1 file. Do not add a second test file.

- [ ] **Step 3: Implement the helper and call it in the slug page**

Call it after the article row loads and before the translation title is passed to a client component. `redirect` from `next/navigation` when the path is non-null.

- [ ] **Step 4: Run the visibility tests and confirm PASS**

Do not commit.

---

### Task 5: Hub tabs and config

**Files:**

- Create: `src/components/dashboard/admin/cms/blog/BlogHub.tsx`
- Create: `src/components/dashboard/admin/cms/blog/BlogConfigPanel.tsx`
- Create: `src/lib/blog/server/saveBlogSettings.ts`
- Modify: `src/app/[locale]/dashboard/admin/cms/blog/page.tsx`
- Modify: `src/app/[locale]/dashboard/admin/cms/blog/actions.ts`
- Modify: `src/components/dashboard/admin/cms/blog/BlogAdminListShell.tsx`
- Modify: `src/dictionaries/en.json`
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/pt.json`
- Test: `src/__tests__/lib/blog/saveBlogSettings.test.ts`
- Test: `src/__tests__/components/dashboard/admin/cms/blog/BlogHub.test.tsx`

**Interfaces:**

- Consumes: `usePersistentPageTab`. `blog_user_can_review` is represented in the page as `canConfigure: boolean`.
- Produces:

```ts
export async function saveBlogSettings(
  supabase: SupabaseClient,
  input: {
    actorId: string;
    canConfigure: boolean;
    blogEnabled: boolean;
    commentsEnabled: boolean;
    guestCommentsEnabled: boolean;
    locale: string;
  },
): Promise<{ ok: true } | { ok: false; code: "forbidden" }>;
```

The action wrapper is `saveBlogSettingsAction` in `actions.ts`.

- [ ] **Step 1: Write the failing tests**

`saveBlogSettings.test.ts` mocks Supabase updates on `site_settings` for keys `blog_enabled`, `blog_comments_enabled`, and `blog_guest_comments_enabled`. When `canConfigure` is false, it returns `{ ok: false, code: "forbidden" }` and does not call update. When true, it calls `recordSystemAudit` with resource type `site_settings` and a payload of the three booleans only.

`BlogHub.test.tsx` renders with `canConfigure={false}` and expects no tab button named by the config label. With `canConfigure={true}` and `tab=config` in a mocked `useSearchParams`, it expects the three switches.

Mock `next/navigation` with `vi.hoisted`.

- [ ] **Step 2: Run the tests and confirm FAIL**

Run: `npx vitest run src/__tests__/lib/blog/saveBlogSettings.test.ts src/__tests__/components/dashboard/admin/cms/blog/BlogHub.test.tsx`

- [ ] **Step 3: Implement**

`page.tsx` loads the three settings. `canConfigure` is true for admin and assistant only. Pass `allowed` as `["articles", "config", "stats"]` when `canConfigure` is true, otherwise `["articles"]`.

`BlogHub` uses `usePersistentPageTab`. The articles panel is the existing `BlogAdminListShell`. Add a visibility badge on each row from `row.visibility`. The badge text comes from the dictionary.

`BlogConfigPanel` is a form with three switches and a save `Button` with a `Save` icon. On `{ ok: true }` it calls `router.refresh()`.

`saveBlogSettings` updates the three keys, calls `recordSystemAudit`, `revalidatePath` for `/${locale}/dashboard/admin/cms/blog` and `/${locale}/blog`, and logs `logServerAuthzDenied` with scope `blog.saveSettings` when the role check fails.

Dictionary keys live under `admin.cms.blog.hub` and `admin.cms.blog.config`. Spanish uses "Guardar", "Comentarios", "Las personas sin cuenta pueden comentar". Do not use voseo.

- [ ] **Step 4: Run the tests and confirm PASS**

Do not commit.

---

### Task 6: Editor fields

**Files:**

- Modify: `src/lib/blog/schemas.ts`
- Create: `src/lib/blog/normalizeArticleWrite.ts`
- Modify: `src/lib/blog/server/saveArticleAction.ts`
- Modify: `src/components/dashboard/admin/cms/blog/BlogArticleMetaForm.tsx`
- Modify: `src/components/dashboard/admin/cms/blog/BlogArticleLocaleFields.tsx`
- Modify: dictionaries under `admin.cms.blog.editor`
- Test: `src/__tests__/lib/blog/saveArticleCta.test.ts`

**Interfaces:**

- Consumes: `parseCtaFields`.
- Produces: `articleCreateInputSchema` includes `visibility: z.enum(["public", "members"]).default("public")` and each translation includes optional `ctaLabel` and `ctaUrl`. Save returns `{ ok: false, code: "cta_incomplete" | "cta_url" }` when `parseCtaFields` fails.

- [ ] **Step 1: Write the failing test**

Create `src/lib/blog/normalizeArticleWrite.ts` only after the test fails. The test imports `normalizeArticleWrite` and expects snake fields `visibility`, `comments_enabled`, `cta_label`, and `cta_url`. Input `{ ctaLabel: "Inscripción", ctaUrl: "" }` returns `{ ok: false, code: "cta_incomplete" }`. Do not widen teacher updates. A teacher still cannot save a published or archived article. That check stays in the existing action and in RLS.

- [ ] **Step 2: Run it and confirm FAIL**

Run: `npx vitest run src/__tests__/lib/blog/saveArticleCta.test.ts`

- [ ] **Step 3: Implement**

`BlogArticleMetaForm` gains a visibility select and a comments switch bound to `commentsEnabled`. `BlogArticleLocaleFields` gains two inputs, label and URL. Wire them through the existing editor hook payload into `saveArticleAction`. The action writes `visibility` and the CTA columns. Revalidate the admin edit path and the public slug path on success. `router.refresh()` stays in the existing editor hook.

Dictionary Spanish: "Quién puede leer", "Público", "Solo con cuenta", "Texto del botón", "Link del botón".

- [ ] **Step 4: Run the test and confirm PASS**

Do not commit.

---

### Task 7: Guest comments and moderation email

**Files:**

- Create: `src/lib/blog/server/createGuestComment.ts`
- Modify: `src/app/[locale]/dashboard/admin/cms/blog/actions.ts`
- Modify: `src/components/dashboard/admin/cms/blog/BlogCommentsModeration.tsx`
- Modify: `src/hooks/useBlogComments.ts`
- Modify: dictionaries under `blog.comments` and `admin.cms.blog.comments`
- Test: `src/__tests__/lib/blog/createGuestComment.test.ts`
- Test: `src/__tests__/components/dashboard/admin/cms/blog/BlogCommentsModeration.test.tsx`

**Interfaces:**

- Consumes: `commentInsertKind`.
- Produces:

```ts
export async function createGuestComment(
  admin: SupabaseClient,
  input: {
    articleId: string;
    bodyText: string;
    displayName: string;
    email: string;
    commentsGloballyEnabled: boolean;
    guestCommentsEnabled: boolean;
    articleCommentsEnabled: boolean;
    visibility: BlogVisibility;
  },
): Promise<{ ok: true } | { ok: false; code: "denied" | "invalid_email" | "invalid_name" }>;
```

The action is `createGuestBlogCommentAction`. It loads the article and the two settings, then calls `createGuestComment`. It never returns the email.

- [ ] **Step 1: Write the failing tests**

`createGuestComment.test.ts` expects an insert into `blog_article_comments` with `status: "pending"`, `author_id: null`, and `guest_display_name` set, plus an insert into `blog_comment_guest_emails`. The function result has no email field. A members article returns `denied` and does not insert.

`BlogCommentsModeration.test.tsx` renders a pending comment fixture with `guestEmail: "ada@example.com"` and expects that text, plus an approve button. Account comments in the fixture do not show an email line.

- [ ] **Step 2: Run the tests and confirm FAIL**

Run: `npx vitest run src/__tests__/lib/blog/createGuestComment.test.ts src/__tests__/components/dashboard/admin/cms/blog/BlogCommentsModeration.test.tsx`

- [ ] **Step 3: Implement**

Validate email with a small Zod string email. Trim the display name. Empty name returns `invalid_name`. `commentInsertKind` must be `guest_pending` or the function returns `denied`.

Use `createAdminClient` only inside the action, then pass that client in. Log failures with scope `blog.createGuestComment`. Do not log the email.

The moderation loader joins `blog_comment_guest_emails` with the reviewer session. The public `useBlogComments` select list does not include the email table. Map `guest_display_name` onto the comment. The public query stays `status = visible`.

Approve calls the existing `moderateBlogCommentAdminAction(id, "visible")`. Add a `Check` icon on that button. Pending copy in Spanish: "Pendiente de revisión".

- [ ] **Step 4: Run the tests and confirm PASS**

Do not commit.

---

### Task 8: Public call to action and guest form

**Files:**

- Create: `src/components/molecules/BlogArticleCtaLink.tsx`
- Create: `src/components/molecules/BlogGuestCommentFields.tsx`
- Create: `src/components/pwa/molecules/BlogGuestCommentSheet.tsx`
- Modify: `src/components/desktop/organisms/BlogArticleDetailDesktop.tsx`
- Modify: `src/components/pwa/organisms/BlogArticleDetailMobile.tsx`
- Modify: `src/components/organisms/BlogCommentsSection.tsx`
- Modify: `src/app/[locale]/blog/[slug]/page.tsx`
- Test: `src/__tests__/components/blog/BlogArticleDetailCta.surfaces.test.tsx`

**Interfaces:**

- Consumes: `createGuestBlogCommentAction`. CTA fields on the translation.
- Produces: desktop renders `BlogGuestCommentFields` inline. Mobile and PWA render those fields inside `BlogGuestCommentSheet`. Both render `BlogArticleCtaLink` only when label and url are non-null. The link is a `Button` or a button-styled anchor with a `ArrowUpRight` icon, min height 44px. On the PWA tree the control is `w-full`.

- [ ] **Step 1: Write the failing surface test**

Render the desktop detail with a CTA and `guestCommentsEnabled`. Expect the link name and the name and email fields. Render the mobile detail and expect the sheet trigger, not the inline email field, until the trigger is clicked. Render with `guestCommentsEnabled={false}` and expect no name field. Render `visibility="members"` only through the page helper from Task 4. This test does not render a members body.

- [ ] **Step 2: Run it and confirm FAIL**

Run: `npx vitest run src/__tests__/components/blog/BlogArticleDetailCta.surfaces.test.tsx`

- [ ] **Step 3: Implement**

`BlogCommentsSection` keeps the signed-in box. It accepts `mode: "account" | "guest" | "hidden"`. The page picks the mode from `commentInsertKind` with the viewer session. Guest mode uses the new fields. Account mode stays on `useBlogComments`.

Submit success for a guest clears the fields and shows the dictionary line that the comment waits for review. Spanish: "Tu comentario queda pendiente de revisión."

The page passes `fromIndex={searchParams.from === "index"}` into Task 9's beacon. This task only renders the CTA. The beacon lands in Task 9.

- [ ] **Step 4: Run the surface test and confirm PASS**

Do not commit.

---

### Task 9: Metrics and the stats tab

**Files:**

- Create: `src/app/api/blog/metrics/route.ts`
- Create: `src/components/blog/BlogMetricBeacon.tsx`
- Create: `src/lib/blog/server/loadBlogAdminStats.ts`
- Create: `src/components/dashboard/admin/cms/blog/BlogStatsPanel.tsx`
- Modify: `src/app/[locale]/blog/page.tsx`
- Modify: `src/app/[locale]/blog/[slug]/page.tsx`
- Modify: `src/components/dashboard/admin/cms/blog/BlogHub.tsx`
- Test: `src/__tests__/api/blogMetricsRoute.test.ts`
- Test: `src/__tests__/lib/blog/loadBlogAdminStats.test.ts`
- Test: `src/__tests__/components/dashboard/admin/cms/blog/BlogStatsPanel.test.tsx`

**Interfaces:**

- Consumes: `blogStatsRates`. RPC `record_blog_metric` and `blog_admin_stats_30d`.
- Produces: `POST /api/blog/metrics` body `{ kind: "list_view" | "article_view" | "cta_click"; articleId: string | null; source: "index" | "other" | null; locale: "en" | "es" | "pt" }`. Response `{ ok: true }` or `{ ok: false, code: "invalid" }` with status 400. Header `Cache-Control: private, no-store`. Cookie `ge_blog_vid` is `HttpOnly`, `SameSite=Lax`, path `/`, max age 400 days, value a uuid. `dedupe_key` is sha256 of `kind|articleId|source|utcDay|cookie`.

`BlogMetricBeacon` posts once on mount. On an article opened with `from=index`, it posts `source: "index"` and then `router.replace` removes `from`. Index pages mount a beacon with `kind: "list_view"`. The CTA click handler posts `cta_click` and then navigates.

`loadBlogAdminStats` returns the `blogStatsRates` object. Teachers do not call it. The stats panel receives that object as props from the server page.

- [ ] **Step 1: Write the failing tests**

Route test: missing cookie causes `Set-Cookie`. Response cache header includes `private` and `no-store` and does not include `public`. Invalid kind returns 400. The RPC mock receives the dedupe key.

`loadBlogAdminStats.test.ts` feeds the RPC jsonb and expects `listToArticle` null when `listViews` is 0.

`BlogStatsPanel.test.tsx` expects the reading number and an em dash string from the dictionary when a rate is null.

- [ ] **Step 2: Run the tests and confirm FAIL**

Run: `npx vitest run src/__tests__/api/blogMetricsRoute.test.ts src/__tests__/lib/blog/loadBlogAdminStats.test.ts src/__tests__/components/dashboard/admin/cms/blog/BlogStatsPanel.test.tsx`

- [ ] **Step 3: Implement**

The route uses the Zod body above. It calls the RPC with the user supabase client from `src/lib/supabase/server.ts`. Log RPC errors with scope `blog.metrics`. A no-op RPC still returns `{ ok: true }` so the page does not show an error.

`BlogStatsPanel` shows the reading count as the primary figure, then the three rates. The table lists title (passed in beside the rates by the page loader), reading, CTA rate, and comment rate. Format percents with `Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 })`.

The hub stats tab renders this panel only when `canConfigure` is true.

Keep the existing `view_count` increment on the article page.

- [ ] **Step 4: Run the three tests and confirm PASS**

Do not commit.

---

### Task 10: ADR, changelog, and the final check

**Files:**

- Create: `docs/adr/2026-10-28-blog-visibility-comments-stats.md`
- Modify: `src/lib/product-changelog/catalog.ts`
- Modify: `supabase/migrations/masterdb.sql` if Task 2 did not regenerate it

**Interfaces:**

- Consumes: the Governance section of the spec.
- Produces: the ADR with Context, Decision, Options considered, and Consequences. The changelog entry id is `blog-hub-config-stats`, date `2026-10-28`, area `cms`.

- [ ] **Step 1: Write the ADR**

Copy the spec Governance section. Add the test list and the log scope names `blog.saveSettings`, `blog.createGuestComment`, and `blog.metrics`.

- [ ] **Step 2: Add the changelog entry at the top of `PRODUCT_CHANGELOG_ENTRIES`**

Spanish summary: "El blog ahora separa notas públicas y notas para cuentas, y muestra comentarios y lectura en una pestaña." English and Portuguese say the same fact. Use `t()`.

- [ ] **Step 3: Run the focused tests**

Run:

```bash
npx vitest run \
  src/__tests__/lib/blog/articleVisibility.test.ts \
  src/__tests__/lib/blog/commentEligibility.test.ts \
  src/__tests__/lib/blog/ctaFields.test.ts \
  src/__tests__/lib/blog/metricFormulas.test.ts \
  src/__tests__/lib/blog/loadPublishedArticles.visibility.test.ts \
  src/__tests__/lib/blog/saveBlogSettings.test.ts \
  src/__tests__/lib/blog/saveArticleCta.test.ts \
  src/__tests__/lib/blog/createGuestComment.test.ts \
  src/__tests__/components/dashboard/admin/cms/blog/BlogHub.test.tsx \
  src/__tests__/components/dashboard/admin/cms/blog/BlogCommentsModeration.test.tsx \
  src/__tests__/components/blog/BlogArticleDetailCta.surfaces.test.tsx \
  src/__tests__/api/blogMetricsRoute.test.ts \
  src/__tests__/lib/blog/loadBlogAdminStats.test.ts \
  src/__tests__/components/dashboard/admin/cms/blog/BlogStatsPanel.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Manual QA stays with the user**

Do not run a browser walkthrough. The checklist is the Manual QA section of the spec.

- [ ] **Step 5: Commit only when the user asks**

One commit. Include the spec, this plan, the ADR, the migration, the regenerated `masterdb.sql`, and the code. Do not push.

---

## Spec coverage

| Spec section | Task |
|--------------|------|
| Visibility public vs members | 1, 2, 3, 4 |
| Global and per-article comments | 1, 2, 5, 6 |
| Guest name, email, pending, reviewer-only email | 2, 7, 8 |
| Account comments stay visible | 1, 2, 8 |
| CTA per translation | 1, 2, 6, 8 |
| Hub tabs and teacher lock | 5, 9 |
| 30-day reading, list, CTA, comments | 1, 2, 9 |
| `view_count` kept | 9 |
| Web vs PWA | 8 |
| Audit, logs, revalidate | 5, 6, 7, 9 |
| ADR | 10 |
| Dictionaries en, es, pt | 5, 6, 7, 8, 9 |

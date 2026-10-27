# Admin weekly digest implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send each admin a Monday mail for the closed week, with waiting work first and institute-colored chart images.

**Architecture:** A service-role SQL function returns one JSON payload. Pure modules parse it, pick the subject, draw SVG, and build the HTML document. The cron rasterizes SVG to PNG, sends through Resend with `cid` images, and stores recipient ids so a retry does not send twice.

**Tech Stack:** Next.js route, Supabase RPC, Vitest, `@resvg/resvg-js`.

## Global Constraints

- Cron `0 12 * * 1` on `GET /api/cron/admin-weekly-digest`, via `runCronAcrossTenants`.
- Week bounds use `analytics.timezone`. Closed week is the last Monday–Sunday before `now`.
- Template key `admin.weekly_digest`. Gate off means no mail and no send row.
- Failed aggregate does not send zeros. Failed PNG does not drop the HTML numbers.
- No email addresses in the mail body. Parent names are surname then given name.
- Spanish copy uses tuteo. Registry has `es`, `en`, and `pt`.
- Cron secret in the query string returns 401.

---

### Task 1: Pure digest rules

**Files:**
- Create: `src/lib/admin-digest/adminWeeklyDigestTypes.ts`
- Create: `src/lib/admin-digest/parseAdminWeeklyDigest.ts`
- Create: `src/lib/admin-digest/closedWeekBounds.ts`
- Create: `src/lib/admin-digest/adminWeeklyDigestSubject.ts`
- Test: `src/__tests__/lib/admin-digest/parseAdminWeeklyDigest.test.ts`
- Test: `src/__tests__/lib/admin-digest/closedWeekBounds.test.ts`
- Test: `src/__tests__/lib/admin-digest/adminWeeklyDigestSubject.test.ts`

- [ ] Parser rejects a payload missing `pendingReceipts`.
- [ ] Monday 2026-10-26 12:00 UTC in `America/Argentina/Cordoba` closes the week 2026-10-19 through 2026-10-25.
- [ ] Subject priority is receipts, then messages, then silent families, then parent percent.

### Task 2: Charts and HTML

**Files:**
- Create: `src/lib/admin-digest/adminWeeklyDigestCharts.ts`
- Create: `src/lib/admin-digest/adminWeeklyDigestCopy.ts`
- Create: `src/lib/admin-digest/buildAdminWeeklyDigestHtml.ts`
- Test: `src/__tests__/lib/admin-digest/buildAdminWeeklyDigestHtml.test.ts`

- [ ] SVG stroke or fill uses the theme primary hex.
- [ ] HTML shows the three Hoy counts, the parent percent, and no `@` mailbox.
- [ ] A quiet digest still renders Hoy counts of zero.
- [ ] Missing chart images leave the numbers in the HTML.

### Task 3: Persistence and cron

**Files:**
- Create: `supabase/migrations/224_admin_weekly_digest.sql`
- Modify: `supabase/migrations/masterdb.sql`
- Create: `src/lib/admin-digest/runAdminWeeklyDigest.ts`
- Create: `src/lib/admin-digest/rasterizeDigestCharts.ts`
- Create: `src/app/api/cron/admin-weekly-digest/route.ts`
- Modify: `vercel.json`
- Modify: `src/lib/email/emailProvider.ts`
- Modify: `src/lib/email/resendEmailProvider.ts`
- Modify: `src/lib/email/templates/templateRegistry.ts`
- Create: `src/lib/email/templates/registryAdminWeeklyDigest.ts`
- Modify: `src/lib/product-changelog/catalogEntriesNow.ts`
- Test: `src/__tests__/app/adminWeeklyDigestCron.test.ts`
- Test: `src/__tests__/lib/admin-digest/runAdminWeeklyDigest.test.ts`

- [ ] Query-string secret returns 401.
- [ ] A second run does not send to an admin id already stored for that week.
- [ ] Aggregate error does not call the mail sender.

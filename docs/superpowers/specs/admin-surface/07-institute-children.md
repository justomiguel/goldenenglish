# Mini 07 — Instituto children (list pages)

**Parent:** [`../2026-08-21-admin-surface-language-design.md`](../2026-08-21-admin-surface-language-design.md)
**Needs:** Mini 00, Mini 02

## Intent

Every Instituto tile should land on a page whose header uses the same icon as the tile.

## Done when

List/hub pages below use `AdminPageHeader` with the mapped `iconId`:

- `/admin/calendar` (+ `/calendar/special` list) → `calendar`
- `/admin/events` (+ `/events/new` title) → `events`
- `/admin/badges` (+ `/badges/new`) → `badges`
- `/admin/coupons` → `coupons`
- `/admin/promotions` → `promotions`
- `/admin/cms` hub → `cms`
- `/admin/cms/blog` list → `blog`
- `/admin/site-setup` title (wizard may keep its own step chrome after the title) → `siteSetup`
- `/admin/settings` and `/settings/integrations` → `settings`
- `/admin/analytics` → `analytics`
- `/admin/audit` → `audit`
- `/admin/glossary` → `glossary`
- `/admin/communications/templates` → `emailTemplates`

`AdminInstituteTrail` stays. No href changes.

## Out of scope

Deep CMS visual editors, event attendee tables, badge award logic (Mini 08).

## Files

The `page.tsx` files for the routes above, plus client shells that currently own the `h1` (`AdminCouponsClient`, `AdminPromotionsClient`, `AdminAnalyticsCharts`, `BlogAdminListShell`, `AdminCmsHubScreen`, `AdminBadgesListScreen`).

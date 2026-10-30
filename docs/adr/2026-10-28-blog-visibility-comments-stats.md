# Blog visibility, comments, and stats

## Context

The blog is public by default. Comments require an account. Staff cannot set visibility, guest comments, or a reading funnel in one place.

## Decision

Per-article visibility, global comment switches, moderated guest comments with email isolated from the public row, and a 30-day metrics table behind reviewer RPCs.

## Options considered

A single JSON blob plus `user_events` misses anonymous readers. A full analytics product (date ranges, unique visitors, campaigns) is a later project.

## Consequences

- Migration `229_blog_visibility_comments_metrics.sql` adds columns, the guest email table, the metrics table, and reviewer RPCs.
- Postgres RLS hides members articles and guest email from anonymous reads.
- Config saves call `recordSystemAudit` with resource type `site_settings` and the three booleans only.
- Failed writes log `[ge:server]` at scopes `blog.saveSettings`, `blog.createGuestComment`, and `blog.metrics`. Logs omit email and comment body.
- Tests: `articleVisibility`, `commentEligibility`, `ctaFields`, `metricFormulas`, `saveArticleCta`, `saveBlogSettings`, `createGuestComment`, `loadMembersSlugGate`, `loadBlogAdminStats`, `blogMetricsRoute`, `BlogHub`, `BlogStatsPanel`, `BlogArticleDetailCta.surfaces`, `BlogCommentsModeration`.

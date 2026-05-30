# Blog/CMS multi-tenant (public + admin editorial workflow)

## Context

Golden English already has a runtime CMS for tenant landing theming (`site_themes`) but no article publishing surface. Product now needs a full blog capability that works on every tenant deployment, with:

- Public article list/detail under `/${locale}/blog`.
- Multi-locale article content (`en`, `es`, `pt`) with fallback to a default locale.
- Staff authors (`admin`, `assistant`, `teacher`) and moderation workflow before publication.
- Scheduled publication via cron.
- Logged-in comments with moderation tools.
- Auto-translation support from the admin editor using Google Cloud Translation.

The repo must keep DDD boundaries, Supabase-only app access, strict RLS, i18n dictionaries for UI copy, and observable server logs/events.

## Decision

- **Tenant scope** follows deployment scope (no `tenant_id` columns).
- **Data model** adds `blog_articles`, `blog_article_translations`, `blog_article_comments`, and `blog_comment_reports`.
- **Editorial workflow** uses `blog_article_status` with `draft | pending_review | scheduled | published | archived`.
  - `teacher`: can create/edit own drafts and submit for review.
  - `assistant` and `admin`: can review, publish, archive, and moderate comments.
- **Comments** are authenticated-only, auto-visible by default, one-level replies max, with rate limiting and report flow.
- **Translation integration** uses Google Cloud Translation v3 credentials stored per tenant in `site_settings` (`google_translation_credentials`) with admin-only access and audit logs.
- **Feature flag** uses `site_settings.blog_enabled` (`true` by default) to allow operational disablement per tenant.
- **Search** uses Postgres generated `tsvector` + GIN index on article translation text.
- **Scheduling** runs via `/api/cron/publish-scheduled-articles` protected by `verifyCronRequest`.

## Options considered

| Option | Rejected because |
|--------|------------------|
| External headless CMS (Sanity/Contentful/Strapi) | Introduces a second persistence/auth surface and breaks current Supabase-first boundary. |
| Per-admin translation credentials in profile data | Operationally fragile when admins rotate; tenant-level integration settings are more stable. |
| Anonymous comments | Higher abuse/spam risk and weaker moderation traceability. |
| No moderation state (`pending_review`) | Does not support the agreed teacher/staff moderation workflow. |
| DeepL as default translator | Team requested Google integration first; can be added later behind same integration boundary. |

## Consequences

- New migration adds blog schema, RLS policies, indexes, storage bucket `blog-media`, and setting seeds.
- New admin surfaces under `/${locale}/dashboard/admin/cms/blog` and integration settings under `/${locale}/dashboard/admin/settings/integrations`.
- Public surfaces (`/blog`, `/blog/[slug]`, `/blog/tag/[tag]`, `/blog/search`, `/blog/rss.xml`) gain SEO metadata/JSON-LD/sitemap hooks.
- Analytics and audit trails expand for publish/archive/review/translate/comment moderation actions.
- Additional tests are required across pure domain helpers, server adapters, cron auth, and UI smoke paths.
- Google credential handling requires strict redaction, no client exposure, and server-side structured logging without secrets.

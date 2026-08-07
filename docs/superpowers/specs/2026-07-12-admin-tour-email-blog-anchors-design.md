# Mini-spec: Admin tour anchors — email templates + blog L3

## Intent

Make `@admin-tours` L3 pass for `screen:admin-email-templates` and `screen:admin-blog` on the isolated stack. Anchors already exist in UI source; failures are access redirect (email templates) and empty-list zero-height (blog).

## Done when

- Isolated E2E admin (`e2e-admin@example.test`) can open `/dashboard/admin/communications/templates` so title/select/editor/preview anchors mount.
- `admin-blog-article-list` remains visible when the article list is empty (empty copy lives inside the tour-anchored container).
- Vitest for mega-admin allowlist covers the e2e email.

## Out of scope

- New anchor ids, tour copy, or Driver.js click-through.
- Changing email template mutation audit / save semantics beyond allowlist membership.

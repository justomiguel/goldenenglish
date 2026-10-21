# Public share links implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every public share URL names the page, and the WhatsApp card explains the content with a real photo.

**Architecture:** Pure path, title, description, and image helpers. Secret routes keep the token and redirect stale slugs. Shop slugs are stored. Each public page sets Open Graph through one server helper. The locale slogan card is removed.

**Tech Stack:** Next.js App Router, Vitest, Supabase migration, dictionaries en/es/pt.

## Global Constraints

- Path words `logro`, `inscripcion`, and `encuesta` stay Spanish in every locale.
- Secret lookup is the token. The slug is cosmetic.
- Shop slug is unique and stored. A previous slug becomes an alias.
- Old addresses use `permanentRedirect`.
- Share title is `{what} · {academy}`. Home title is the academy name.
- Description is at most 180 characters and is not the slogan alone.
- Image order is page photo, then home photo (`inicio`, then `modalidades`), then the home logo.
- Do not put a student or buyer name in preview text.
- Dashboard URLs stay as they are.
- Additive migration only.

---

### Task 1: Pure share helpers

- [ ] Add path, title, clip, and image pickers with Vitest.
- [ ] Point section enrollment paths at `/inscripcion/`.

### Task 2: Shop slugs

- [ ] Migration `218_shop_product_slugs.sql` plus `masterdb.sql`.
- [ ] Allocate a slug on create and update. Catalog links use the slug.

### Task 3: Routes and emitters

- [ ] New canonical pages and permanent redirects for the URL map.
- [ ] Copy, mail, and payment return URLs use the builders.

### Task 4: Share card

- [ ] Server helper resolves the image chain.
- [ ] Public pages set title, description, and image.
- [ ] Remove `src/app/[locale]/opengraph-image.tsx`.

### Task 5: Docs

- [ ] ADR `docs/adr/2026-10-20-public-share-links.md`.
- [ ] Product changelog entry.

# Mozarthitos — entry CTAs to "Encuentra tu clase" (mini-spec)

Status: draft (waiting for approval)
Date: 2026-11-07
Tenant template: `mozarthitos` (`site_theme_kind`)
Parent spec: `docs/superpowers/specs/2026-11-07-mozarthitos-family-guide-design.md`

## Context

The family guide page `/[locale]/encuentra-tu-clase` ships and works. No link on the site opens it.

- The parent spec says: "The hero and the `#cursos` section link to it." That task (plan step 7) did not ship.
- `landing.mz.guide.entryCta` exists in `en.json`, `es.json`, `pt.json`, and in the CMS key list. No component reads it.
- The hero secondary CTA opens `/[locale]#quienes` ("Descubre Mozarthitos"). That section is the next one on the same page.
- The `#cursos` online CTA opens `/[locale]#contacto`. The parent spec calls this a dead end.
- The PWA tab bar "Cursos" tab opens `/[locale]#cursos`.

## Intent

Give a new family three visible ways into the guide on the mozarthitos tenant. Keep the register CTA as the primary hero action.

## Decisions

1. **Hero secondary CTA** (`LandingMozarthitosSections.tsx`).
   - `href`: `buildGuidePageHref(locale)` → `/[locale]/encuentra-tu-clase`.
   - Label: `marketingLandingCopy(dict, brand, "mz.guide.entryCta")` (CMS-editable). If the CMS helper does not resolve `mz.*` keys, read `dict.landing.mz.guide.entryCta` after `applyLandingContentOverrides`.
   - Icon: keep a leading Lucide icon (`Compass` or `Sparkles`), `aria-hidden` (rule 16).
   - The yellow register CTAs (`landingRegisterCtasFromDict`) do not change and stay first.
   - The `#quienes` link is removed from the hero. The header still has "Quiénes somos".
2. **`#cursos` online CTA** (`LandingMozarthitosCursosSection.tsx`).
   - `href`: `buildGuidePageHref(locale, { attendance: "remote" })` → `/[locale]/encuentra-tu-clase?modalidad=remote`. The family answers only the age step.
   - Label: keep `cursos.onlineCta` and the `Laptop` icon. Only the target changes.
3. **PWA tab bar "Cursos" tab** (`publicPwaCoursesHref` in `src/lib/theme/publicExperienceNav.ts`).
   - For `mozarthitos` only, return `/[locale]/encuentra-tu-clase`. Other kinds keep their `#anchor`.
   - The active-tab check in `PublicPwaTabBar` uses `pathname === href`, so the tab shows as current on the guide page. A query string on the guide page does not break this, because `usePathname()` has no query.
   - Do not import from `src/lib/landing/mozarthitos/` into the theme module if it creates a cycle. If it does, move `MZ_GUIDE_PATH` usage behind a small map entry (`mozarthitos: "/encuentra-tu-clase"` path vs anchor).
4. **Header nav.** No change. The desktop header already holds six to eight links.
5. **Analytics.** No new event. Anonymous visitors cannot post to `/api/analytics/events` (parent spec). The funnel outcome stays `tenant_extras.guide` on the registration.
6. **Changelog.** Entry `mozarthitos-find-your-class` exists with today's date. Update its `summary` in three locales to say the hero, the courses section, and the phone tab bar open the guide. No new entry.

## Surfaces (Web vs PWA)

Tier A public journey.

- **Web (`web-desktop`).** Hero secondary CTA and `#cursos` online CTA change target. Layout and styles do not change.
- **PWA (`web-mobile` / `pwa-mobile`).** The landing JSX is shared, so both CTAs change on the phone too. Touch targets stay `min-h-[48px]`. The "Cursos" tab in `PublicPwaTabBar` opens the guide for mozarthitos only.
- **Other tenants.** `publicPwaCoursesHref` output does not change for `classic`, `nago`, `espaciozenit`, `mimundo`, `liora`, and the generic kinds.

## Tests (Vitest, self-contained)

- `publicExperienceNav.test.ts`: `publicPwaCoursesHref("mozarthitos", "es")` returns `/es/encuentra-tu-clase`. Existing assertions for other kinds stay.
- `LandingMozarthitosSections.hero.test.tsx`: the hero has a link to `/es/encuentra-tu-clase` with the `entryCta` label. The register CTAs still render first. No hero link to `#quienes`.
- Cursos section test (new or extended): the online CTA `href` is `/es/encuentra-tu-clase?modalidad=remote`. No link to `#contacto` from that button.
- `PublicPwaTabBar.test.tsx`: with `coursesHref="/es/encuentra-tu-clase"` and pathname `/es/encuentra-tu-clase`, the Cursos tab has `aria-current="page"`.
- `REGRESSION CHECK` note in the nav test: changing the mozarthitos courses target affects only that tenant's tab bar.

## Manual QA (user)

- Desktop landing: the hero secondary button opens the guide. The "Modalidad online" button opens the guide on the age step with "desde casa" preselected.
- Phone and installed PWA: the same two buttons, and the "Cursos" tab opens the guide and shows as active.
- Edit `mz.guide.entryCta` in the CMS and check the hero label.

## Done when

- The three entry points open the guide on the mozarthitos tenant.
- Other tenants' landing and tab bar do not change.
- The tests above pass. The changelog summary mentions the entry points.

## Out of scope

- A header nav item for the guide.
- New analytics events.
- Copy changes to the guide page.
- Guide entry points on other tenants.

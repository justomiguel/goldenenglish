# Mozarthitos — entry CTAs to "Encuentra tu clase" (mini-spec)

Status: approved (2026-11-07, amended the same day)
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

Give a new family one yellow button into the guide on the mozarthitos tenant. The guide already ends on the pre-registration form.

## Decisions

1. **One hero CTA** (`LandingMozarthitosSections.tsx`).
   - Remove the register buttons and the outline button. The hero has one yellow button.
   - `href`: `buildGuidePageHref(locale)` → `/[locale]/encuentra-tu-clase`.
   - Label: `marketingLandingCopy(dict, brand, "guide.entryCta")`. Default copy: es `Vive la experiencia`, en `Live the experience`, pt `Viva a experiência`. The CMS key stays `mz.guide.entryCta`.
   - Icon: leading `Compass`, `aria-hidden` (rule 16).
   - The header still has "Quiénes somos".
2. **`#cursos` section.** Remove the online CTA button. The section text stays. The hero button is the only call to action into the guide.
3. **PWA tab bar "Cursos" tab.** Keep `/[locale]#cursos`. The tab opens the courses section. It does not open the guide.
4. **End of the guide.** The result buttons already open `/[locale]/register` with the guide token. That page is the pre-registration form. Do not change those links. The contact offer stays on `#contacto` when a stage has no online class.
5. **Header nav.** No change. The desktop header already holds six to eight links.
6. **Analytics.** No new event. Anonymous visitors cannot post to `/api/analytics/events` (parent spec). The funnel outcome stays `tenant_extras.guide` on the registration.
7. **Changelog.** Update the `mozarthitos-find-your-class` summary in three locales. Say the home has one yellow button that opens the guide, and the guide ends on the pre-registration form.

## Surfaces (Web vs PWA)

Tier A public journey.

- **Web (`web-desktop`).** The hero shows one yellow button. The courses section has no button. Touch target stays `min-h-[48px]`.
- **PWA (`web-mobile` / `pwa-mobile`).** The landing JSX is shared, so the phone hero has the same one button. The "Cursos" tab still opens `#cursos`.
- **Other tenants.** `publicPwaCoursesHref` does not change.

## Tests (Vitest, self-contained)

- `publicExperienceNav.test.ts`: `publicPwaCoursesHref("mozarthitos", "es")` returns `/es#cursos`.
- `LandingMozarthitosSections.hero.test.tsx`: the hero has one link, "Vive la experiencia", to `/es/encuentra-tu-clase`, with the yellow button class. No register link.
- Cursos section test: the section renders no link.
- `REGRESSION CHECK` note in the nav test: the Mozarthitos courses tab stays on `#cursos`.

## Manual QA (user)

- Desktop and phone: the yellow "Vive la experiencia" button opens the guide. The courses section has no button. The phone Cursos tab opens the courses section.
- Finish the two questions. The result button opens the pre-registration form with the chosen class.
- Edit `mz.guide.entryCta` in the CMS and check the hero label.

## Done when

- The mozarthitos hero has one yellow button, and that button opens the guide.
- Other tenants' landing and tab bar do not change.
- The tests above pass. The changelog summary mentions the entry points.

## Out of scope

- A header nav item for the guide.
- New analytics events.
- Copy changes to the guide page.
- Guide entry points on other tenants.

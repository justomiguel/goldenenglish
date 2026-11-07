# Mozarthitos guide entry CTAs

Spec: `docs/superpowers/specs/2026-11-07-mozarthitos-guide-entry-ctas-design.md`

## Correction

`marketingLandingCopy(dict, brand, path)` already scopes to `dict.landing.<brand>`. The hero label path is `guide.entryCta`, not `mz.guide.entryCta`.

## Steps

1. Fail `publicExperienceNav.test.ts`: mozarthitos courses href is `/es/encuentra-tu-clase`. Other kinds stay on their anchors.
2. Make `publicPwaCoursesHref` return a path for mozarthitos from a local map. Do not import the landing guide module.
3. Fail the hero test: secondary link is the guide, register stays first, no `#quienes` link.
4. Point the hero secondary link at `buildGuidePageHref(locale)` with `guide.entryCta` and a `Compass` icon.
5. Fail a cursos section test: online CTA href is `/es/encuentra-tu-clase?modalidad=remote`.
6. Point that link at `buildGuidePageHref(locale, { attendance: "remote" })`. Keep the label and the `Laptop` icon.
7. Fail `PublicPwaTabBar`: `coursesHref="/es/encuentra-tu-clase"` is current on that pathname.
8. Update the `mozarthitos-find-your-class` changelog summary in three locales.

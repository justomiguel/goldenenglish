# Global PWA install prompt (floating host)

## Intent

Surface the existing installability UX (`PwaInstallPrompt` + `usePwaInstallPrompt`) on **every locale route** via a **single floating host**, so parents, students, staff, login, and public pages can install the app—without duplicating inline mounts.

## Context

- Today the prompt mounts only in `ParentPwaShell` (inline) and optionally `StudentDashboardEntry` (`pwaInstall` prop).
- Manifest + service worker already exist; install logic (Android `beforeinstallprompt`, iOS Share hint, dismiss persistence, standalone skip) stays unchanged.
- User chose **option 1**: one global floating banner under `[locale]`.

## Decision

1. **Single host** — Mount a thin client host once from `src/app/[locale]/layout.tsx` (after loading `dict.pwa.install` via `getDictionary` / existing brand+setup resolve).
2. **Floating presentation** — Fixed bottom-center card (pattern aligned with `TeacherSectionRoster` toast: `z-[200]`, tokens, safe-area). On narrow viewports, add bottom clearance (~parent tab bar height, ~4.5rem) so the parent PWA tab bar is not covered.
3. **Dedup** — Remove inline `PwaInstallPrompt` from `ParentPwaShell` and `StudentDashboardEntry` (drop unused `pwaInstall` prop).
4. **Skip when** — Existing hook rules: already standalone, dismissed (`ge_pwa_install_prompt_dismissed`), or (layout) greenfield initial site setup (`needsInitialSiteSetup`) so setup wizards stay clean.
5. **Copy** — Reuse `dict.pwa.install` (en/es); no new product strings unless a11y `role`/`aria` needs a key (prefer existing).

## Approaches considered

| Approach | Pros | Cons |
|---|---|---|
| **A. Locale-layout floating host (chosen)** | One mount, true “everywhere”, no duplicates | Must clear bottom chrome (tab bar) |
| B. Inline in every shell | Familiar card | Duplicates, misses login/landing, high churn |
| C. Root `app/layout.tsx` host | Even broader | Harder locale/dict wiring; offline/non-locale edge cases |

## Consequences

- **UI** — Install CTA can appear on admin/teacher/assistant/login/landing when the browser is installable.
- **Tests** — Host smoke + layout wiring; update parent/student tests that assumed inline prompt; keep hook tests.
- **Manual QA (user)** — Android Chrome: banner → Install; iOS Safari: Share steps; dismiss persists; no double banner on parent home; tab bar still usable.

## Done when

- [ ] Floating host mounted from `[locale]/layout` with dictionary copy.
- [ ] Inline mounts removed from parent PWA shell and student dashboard entry.
- [ ] Standalone / dismissed / greenfield skip behavior preserved or improved as above.
- [ ] Vitest coverage for host visibility + no duplicate mounts in parent/student fixtures.
- [ ] Narrow viewport bottom clearance does not permanently hide parent tab bar actions.

## Out of scope

- Changing install heuristics / SW registration / manifest icons.
- Push-notification onboarding.
- Forcing install on browsers that never fire `beforeinstallprompt` (beyond existing iOS hint).
- Analytics events for install accept/dismiss (optional follow-up).

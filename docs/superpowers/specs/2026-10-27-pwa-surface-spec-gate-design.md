# PWA surface check at spec time (Gate 0)

**Intent:** Every spec for a screen change must review the PWA implementation and design the Web and PWA surfaces separately.

**Done when:**

- A new rule `.cursor/rules/43-pwa-surface-spec-check.mdc` (`alwaysApply: true`) requires a PWA surface check during Gate 0 spec writing.
- `.cursor/rules/20-agent-preflight.mdc` and `.cursor/rules/05-pwa-mobile-native.mdc` reference this requirement at spec time.
- `AGENTS.md` lists the new rule in the `alwaysApply` table.

**Out of scope:**

- Changes to product code under `src/`.
- Changes to Tier B desktop-only rules where no PWA tree exists.

## Context

`05-pwa-mobile-native.mdc` defines Tier A (`web-desktop`, `web-mobile`, `pwa-mobile`) and separate component trees. However, `20-agent-preflight.mdc` does not force the spec author to inspect the PWA tree during Gate 0. When a developer or agent designs a change for a screen only from the desktop view, the spec can miss the PWA variant or break shared props, hooks, and server actions.

## Decision

1. Create `.cursor/rules/43-pwa-surface-spec-check.mdc` with `alwaysApply: true`.
2. Require every Gate 0 spec that touches a screen, route, or shared UI/hook/action to:
   - Locate the screen entry (`useAppSurface()`, `SurfaceMountGate`) and all surface trees (`src/components/pwa/`, `src/components/desktop/`, `*Mobile*.tsx`, `*Pwa*.tsx`).
   - Include a **Surfaces (Web vs PWA)** section in the spec.
   - Design the PWA interaction separately when the screen is Tier A or already has a PWA tree.
   - Verify that shared props, hooks, and server actions do not break the PWA tree when only the Web tree is requested.
3. Cross-link the rule in `20-agent-preflight.mdc`, `05-pwa-mobile-native.mdc`, and `AGENTS.md`.

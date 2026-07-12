# Fix precommit coverage failures (update tests)

**Intent:** Align stale Vitest expectations with current product UI/copy and harden PWA prompt tests so `localStorage` exists in jsdom — **tests only**, no app behavior change.

**Done when:** `adminNarrowScreens`, `surfaceGatesNarrow`, `usePwaInstallPrompt`, `PwaInstallPrompt`, `PushPermissionBanner` pass in isolation; no product source changes for this fix.

**Out of scope:** Changing Import Users UX, PWA install prompt product behavior, or re-running full precommit unless asked.

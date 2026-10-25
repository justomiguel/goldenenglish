# Installed app remainder — design

**Status:** Approved (2026-10-23)
**Date:** 2026-10-23

## Intent

The installed app must keep a thin bar and the public dock at every width.
Auth screens must not stack a second header on that bar.
Nagô auth marks use the home logo.
Blog, events, shop, and `/q` on Nagô sit on the page surface.
The offline page and the manifest follow the same install.

## Done when

1. Standalone at any width shows `PublicInstalledTopBar` and the public dock.
2. The mobile browser and the desktop browser stay unchanged.
3. Login, forgot-password, and reset-password headers carry `public-marketing-chrome`.
4. Those screens use the Nagô home logo when the theme is `nago`.
5. The Nagô blog shell has no `nago-public-sheet` around the page.
6. `/offline` uses safe area and the active theme chrome.
7. The manifest orientation is `any`. It adds a student shortcut and keeps the parent shortcuts.

## Out of scope

- Admin PWA program.
- Teacher and assistant shells.
- A real Courses route. The tab stays a home hash.
- New home-screen icons for themes other than Nagô.
- First-run setup chrome.
- Pull-to-refresh in the mobile browser.
- Hiding the marketing header in the mobile browser.

## Decision

Detect install in `useAppSurfaceCore` with the same standalone media query and iOS `navigator.standalone` check.
Do not add a surface member. `SurfaceMountGate` still treats a wide window as desktop.
CSS shows `.public-pwa-tab` in `display-mode: standalone` so the dock is visible before paint.

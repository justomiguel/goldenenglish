# Dashboard mobile drawer visible via body portal

**Date:** 2026-08-07  
**Status:** Implemented  
**Related:** `AdminMobileDrawer`, `TeacherMobileDrawer`, `AssistantMobileDrawer`,
`StudentMobileDrawer`, `AdminChromeHeader`, `TeacherChromeHeader`,
`StudentChromeHeader`, `ParentDashboardShellClient`, `ParentPwaShell`,
`SurfaceMountGate`, `useAppSurface`

## Intent

On a phone browser, tapping the dashboard hamburger appears to do nothing. The menu
button exists; the full-screen nav never becomes usable. Fix that for every role that
still uses the responsive chrome drawer, without mixing that pattern into surfaces that
already have a dedicated PWA shell.

## Problem

`AdminMobileDrawer` (and the teacher / student / assistant twins) render
`position: fixed; inset: 0` overlays as children of the chrome header.

Those headers use `sticky` + `backdrop-blur-md`. `backdrop-filter` creates a containing
block for fixed descendants, so the overlay is clipped to the header’s ~60px box instead
of the viewport. Stacking stays inside the header’s `z-50` context. Result: tap opens
state, body scroll locks, but the user sees almost nothing.

## Surface boundary (PWA vs responsive)

`AppSurface` = `web-desktop` | `web-mobile` | `pwa-mobile`.

| Role | Narrow navigation today | This work |
|------|-------------------------|-----------|
| Parent / Student | `ParentPwaShell` + tab bar for both `web-mobile` and `pwa-mobile` | **Do not** introduce a hamburger drawer. Leave shell gating alone. |
| Admin / Teacher / Assistant | Desktop chrome + `*MobileDrawer` on all surfaces (no role-level PWA shell) | Portal the drawer overlay so it paints on the viewport. |
| Admin screen content | Some routes use `SurfaceMountGate` → `*Narrow` / PWA screens | **Unchanged.** Drawer fix does not replace those with desktop tables. |

`StudentDashboardShell` / `StudentMobileDrawer` are not mounted by any live route
(student layout uses `ParentDashboardShell` → `ParentPwaShell` on narrow). Still update
`StudentMobileDrawer` the same way so the shared pattern cannot regress if revived, and
so tests stay aligned. Do **not** mount `StudentDashboardShell` on student routes.

## Approach

Shared helper + `createPortal` to `document.body` (same escape hatch as
`ProfileAvatarFabMenu` / `RecipientAutocomplete`). Rejected alternatives: removing header
`backdrop-blur` (fragile, visual regression) or a new `AdminPwaShell` (out of scope).

## Design

### Shared behavior

Introduce a small client helper (name up to implementer, e.g. `useDashboardMobileDrawer`
and/or a thin `DashboardMobileDrawerPortal` wrapper) that owns:

1. `open` / `close` state  
2. Escape key closes while open  
3. `document.body.style.overflow = "hidden"` while open; restore on close/unmount  
4. Close when viewport matches `(min-width: 768px)` (existing Tailwind `md` behavior)  
5. When open, render overlay UI via `createPortal(..., document.body)`

The hamburger button stays in the header (not portaled). Only the open overlay
(backdrop + dialog) portals.

### Overlay chrome

Keep existing visual structure per drawer (badge, title, close, back-to-site / sign-out /
locale where present, then role nav content). Requirements:

- Backdrop + dialog use viewport-fixed positioning after portal  
- z-index above chrome header (`z-50`) — e.g. backdrop `z-[100]`, dialog `z-[101]` (exact
  values may match existing drawer numbers as long as they compete at `document.body`)  
- Dialog remains `role="dialog"` with the same `aria-label` as today  
- `onNavigate` still closes the drawer  
- Preserve `md:hidden` wrapper around the trigger so desktop is unchanged  

### Files to change

- New helper under `src/hooks/` or `src/components/dashboard/`  
- `AdminMobileDrawer.tsx`  
- `TeacherMobileDrawer.tsx`  
- `AssistantMobileDrawer.tsx`  
- `StudentMobileDrawer.tsx`  

No changes to `ParentPwaShell`, `ParentDashboardShellClient` surface branching, or
admin `SurfaceMountGate` narrow screens except if a z-index collision with the portaled
drawer is discovered (then raise drawer z-index only).

### Testing

- Extend `AdminMobileDrawer` tests: after open, dialog is in the document and is a
  descendant of `document.body` (portal), not trapped under the header node.  
- Keep existing “close on md + unlock body” coverage.  
- Smoke or shared-helper unit test for open → portal → Escape / md close if the helper
  is extracted cleanly.  
- Do **not** add tests that mount a responsive drawer for parent/student narrow shells.

### Out of scope

- Redesigning admin tables/forms for mobile  
- Building `AdminPwaShell` / teacher PWA shell  
- Mounting or deleting `StudentDashboardShell`  
- Changing parent/student to use the hamburger drawer on narrow  

## Acceptance

1. On a phone-width viewport, admin / teacher / assistant: tap hamburger → full-screen
   nav is visible and scrollable; links navigate; close / backdrop / Escape dismiss.  
2. Parent / student on narrow still use `ParentPwaShell` tab navigation (no new drawer).  
3. Desktop (`md+`) sidebar unchanged.  
4. Existing admin narrow PWA screens via `SurfaceMountGate` still render as before.  
5. Unit tests for portal + md-close pass.

# Installed public app chrome — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** The installed app hides marketing chrome, keeps a thin logo and language bar plus the public dock, and the student or parent portal keeps the landing font root.

**Architecture:** `display-mode: standalone` hides `.public-marketing-chrome`. `PublicExperienceFrame` mounts `PublicInstalledTopBar` only on `pwa-mobile`. Flow routes use `PublicFlowFrame` instead of the blog shell. Register headers take the real session email. Student and parent layouts wrap `PortalShell` in `PublicTenantChrome`.

**Tech Stack:** Next.js App Router, React, Tailwind, Vitest, `useAppSurface`.

## Global Constraints

- Desktop layout does not change.
- Mobile browser keeps the full header, footer, and dock.
- No new login card per theme.
- No new install icon.
- `/b/[token]` only redirects. Do not wrap it.
- Files stay under 250 lines.
- Spanish copy stays tuteo. Do not add keys if the logo alt already names the home link.
- No new analytics event. No ADR.

---

### Task 1: Thin bar

- Test: bar shows on `pwa-mobile` only. Home link and language nav are present. No menu button.
- Add `PublicInstalledTopBar`.
- Pass logo from `PublicExperienceShell` into the frame.

### Task 2: Hide marketing chrome

- Add `.public-marketing-chrome` to public headers and marketing footers.
- CSS hides that class in `display-mode: standalone`.

### Task 3: Flow frame

- `PublicFlowFrame` plus compact header. No blog sheet.
- Point encuesta, clase-prueba, matricula, and unirse layouts at it.
- Wrap the logro page. Leave `/b/[token]` as a redirect.

### Task 4: Session on secondary headers

- Optional `sessionEmail` on register headers and the screens that render them.
- Register, contact, privacy, and section-enrollment pages pass `loadRequestSessionEmail()`.

### Task 5: Portal font root

- Student and parent layouts wrap `PortalShell` with `PublicTenantChrome`.
- Classic stays unwrapped inside that component. Nagô uses the font root with sound off.

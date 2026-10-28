# Golden register reception — implementation plan

> **For agentic workers:** TDD in this session. Do not commit while other WIP is mixed unless the user says so.

**Goal:** Classic Golden `/register` becomes a reception desk on desktop and form-only on the phone.

**Architecture:** Keep `RegisterForm`. Restyle `RegisterClassicSurface`. Extract `RegisterClassicFigure` for the desktop column. Copy under `landing.classic.register`.

**Tech Stack:** Next.js App Router, Tailwind tokens, Vitest + Testing Library.

## Global Constraints

- Tokens only. No hex. No new font root.
- Spanish tuteo neutro. No kicker chips.
- `RegisterForm` stays shared. No PWA fork.
- Surface files ≤ 250 lines.

## Task 1 — Copy

- Add `landing.classic.register` (`shellTitle`, `shellLead`, `figureTitle`, `figureLead`) to en/es/pt.

## Task 2 — Surface test then layout

- `src/__tests__/organisms/RegisterClassicSurface.test.tsx` (Nago stub pattern).
- Implement two-column `lg` grid, hide figure below `lg`, paper sheet around the form.
- `RegisterClassicFigure` holds collage + figure copy.
- Login link gets a Lucide icon.

## Task 3 — Changelog + verify

- Prepend `register-classic-reception` in `catalogEntriesNow.ts`.
- Run the new surface test plus `RegisterSurfaceByTemplate`.

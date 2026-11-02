# CentroListo country prices

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show Chile, Argentina, Uruguay, and Paraguay prices on the CentroListo marketing site from `?pais=` and a cookie.

**Architecture:** A pure market module resolves the country and formats amounts. Server pages read the query and the cookie. Shared price components receive the country. Desktop and PWA headers share one `<select>`.

**Tech Stack:** Next.js App Router, Vitest, dictionary JSON.

## Global Constraints

- Query key is `pais`. Values are `cl`, `ar`, `uy`, `py`. Cookie name is `centrolisto_market`.
- Default country is Chile.
- Monthly and custom-landing amounts are the published tables in the spec. They are static.
- Gestión has no one-time fee. The 50-student cap is copy only.
- Spanish copy is neutral tuteo. English and Portuguese match.
- Billing does not read this module.

---

### Task 1: Market resolution and amounts

- [x] Test resolve order, href helper, and the four currencies.
- [x] Implement `centrolistoMarket.ts` and rewrite `centrolistoCommercialOffer.ts`.

### Task 2: Copy

- [x] Add the country labels, the 50-student line, the shop line, and the single custom-landing row in `en.json`, `es.json`, and `pt.json`.

### Task 3: Surfaces

- [x] Pass the resolved country from marketing pages into the price views.
- [x] Add the select to desktop chrome and PWA chrome.
- [x] Keep `pais` on marketing links when the country is not Chile.

### Task 4: Tests

- [x] Pricing view shows Argentina amounts and hides the old 49990 fee.
- [x] Both chromes expose the four countries.

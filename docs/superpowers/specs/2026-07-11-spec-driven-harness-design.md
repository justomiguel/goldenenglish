# Spec-Driven Development + Harness Engineering (self-contained tests)

**Date:** 2026-07-11  
**Status:** Approved design (pending implementation)  
**Owner:** Agent + Justo  

## Context

Golden English already has TDD (`02-testing-tdd.mdc`, `.agents/skills/tdd`), preflight (`20-agent-preflight.mdc`), and ADRs (`10-engineering-governance.mdc`). It does **not** yet enforce Spec-Driven Development (SDD) as a single agent workflow, nor a written contract for **self-contained** component/unit tests (“harness engineering” in the isolation sense).

We want every change— including tiny ones—to start from a written spec, and every new/touched test file to own its setup without depending on other tests or implicit global product mocks.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Test ownership | **A** — Each test file owns fixtures/mocks/setup; shared helpers optional and **explicitly imported** |
| SDD scope | **A** — Always for work that changes behavior or product code |
| Trivial carve-out | **C** — Nothing skips: even one-line changes get a **mini-spec** |
| Packaging | **B** — Specs/plans under `docs/superpowers/`; unify `20-agent-preflight` as Gate 0 of SDD; new always-apply rules + skills |

## Goals

1. One agent workflow: **spec → user approval → plan (when needed) → TDD implementation**.
2. Preflight is not a competing protocol; it is **Gate 0** of SDD.
3. New/touched tests are **self-contained**: readable alone, order-independent, mocks visible in-file (or via explicit helper import).
4. No mass migration of legacy tests in phase 1; apply contract going forward.

## Non-goals (phase 1)

- CI gate that requires a linked spec on every PR.
- Mandatory shared `renderWithProviders` harness.
- Rewriting all existing tests for isolation.
- Replacing ADR / `10-engineering-governance` when that rule still requires an ADR.

## Workflow

```
Gate 0  Preflight / mini alignment  →  draft Understanding, Assumptions, Plan, Risks, DoD
Gate 1  Spec file                   →  docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
Gate 2  User approval               →  explicit OK on the written spec (or chat “ok mini-spec” for tiny)
Gate 3  Plan                        →  docs/superpowers/plans/… when >1 file or behavior; else plan inline in spec
Gate 4  Implement                   →  TDD per 02 + skills/tdd; harness rules for tests
```

### Mini-spec (required even for tiny changes)

Minimum sections (can be ~5–15 lines):

- **Intent** — what changes and why  
- **Done when** — verifiable criteria  
- **Out of scope** — what we are not doing  

Path still under `docs/superpowers/specs/` (or a dated mini file). Chat-only approval is allowed **after** the mini-spec exists on disk.

### Full spec

Used when brainstorming already produced a multi-section design (architecture, risks, contracts). Same folder; richer structure.

### Relationship to Superpowers

- **brainstorming** — explore → design → write this folder’s specs  
- **writing-plans** — after user reviews the written spec  
- **tdd** / **executing-plans** / **subagent-driven-development** — implementation  

## Artifacts to create

### Rules (English, `.cursor/rules/`)

| File | Apply | Role |
|------|-------|------|
| `20-agent-preflight.mdc` | Rewrite, `alwaysApply: true` | Gate 0 of SDD; remove “skip for trivial”; map deliverable block to spec draft; still allow read-only exploration |
| `29-spec-driven-development.mdc` | New, `alwaysApply: true` | Spec → approval → plan → implement; paths; mini vs full; link Superpowers + preflight |
| `30-harness-self-contained-tests.mdc` | New, `alwaysApply: true` | Isolation contract; complements `02-testing-tdd` |

### Skills (`.agents/skills/`)

| Skill | Role |
|-------|------|
| `spec-driven-development` | Workflow, templates, gates, when to invoke |
| `harness-self-contained-tests` | Isolation checklist, Vitest/RTL patterns for this repo |

### Docs

| Path | Role |
|------|------|
| `docs/superpowers/specs/README.md` | Naming, mini vs full |
| `docs/superpowers/plans/README.md` | When separate plan vs inline |
| `AGENTS.md` | Point “preflight” section at unified SDD |

## Self-contained test contract

A test file is **self-contained** if a reader can open only that file and know: subject under test, mocks, fixtures, cleanup—without relying on another test file or Vitest run order.

### Required

1. Local `vi.mock`, factories, fixtures, and `beforeEach`/`afterEach` in the same file **or** via an **explicit** import of a pure helper (e.g. `makeAdminDict()`).
2. No cross-file mutable shared state.
3. File must pass alone: `npx vitest run path/to/file.test.ts`.
4. One primary subject per file (component / hook / module).
5. Mock at boundaries (Supabase, Resend, `next/navigation`, etc.) per `02-testing-tdd`.
6. Assert user-observable behavior (RTL roles/labels; dictionary keys / mocked dict), not brittle internals.

### Allowed

- Optional helpers under `src/__tests__/helpers/` (or agreed path) **without** product-domain global side effects.
- Importing shared dict snippets explicitly.

### Forbidden

- Depending on another test having run first.
- `setupFiles` that mock product domains (neutral polyfills in Vitest config remain OK).
- Implicit fixtures loaded by path magic.

### Scope of enforcement

- **New and touched** tests must comply.
- Legacy tests: fix when touched; no big-bang rewrite in phase 1.

## Consequences

**Positive**

- Agents cannot “just code” without a written intent and done criteria.
- Tests remain portable and reviewable in isolation.
- Preflight and SDD stop competing.

**Risks**

- Friction on tiny edits → mitigated by **mini-spec** template (short, always).
- Agents may invent specs after coding → rule/skill must hard-gate “no implementation before approval”.
- Always-apply rule count grows → keep each rule concise (&lt; ~80 lines), one concern each.

**Follow-ups (phase 2, out of this change)**

- Optional CI check: PR touches `src/` ⇒ linked spec path in PR body or docs.
- Optional shared RTL wrapper **only if** still imported explicitly per test file.

## Definition of done (this initiative)

- [ ] Spec file committed/present: this document.  
- [ ] `20` rewritten as SDD Gate 0.  
- [ ] `29` and `30` rules added (English).  
- [ ] Skills `spec-driven-development` and `harness-self-contained-tests` added.  
- [ ] `docs/superpowers/{specs,plans}/README.md` added.  
- [ ] `AGENTS.md` updated to describe unified SDD.  
- [ ] No product runtime code required for phase 1.

## Options considered

| Option | Why rejected |
|--------|----------------|
| Overlay only (new rule, leave `20` as-is) | Duplicate workflows; skip risk |
| Opt-in SDD via `SPEC` tag only | Conflicts with “always” decision |
| Mandatory shared render harness | Conflicts with ownership model **A** |
| Full CI enforcement now | Deferred to phase 2 |

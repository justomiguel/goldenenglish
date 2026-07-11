# Spec-Driven Development + Harness Engineering — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install repo rules and skills so every change starts with a written spec (mini or full) and every new/touched test file is self-contained.

**Architecture:** Unify `20-agent-preflight` as SDD Gate 0; add always-apply rules `29` (SDD) and `30` (harness tests); add two agent skills; document `docs/superpowers/{specs,plans}/`; update `AGENTS.md`. No product runtime code.

**Tech Stack:** Cursor `.mdc` rules (en-US), `.agents/skills/*/SKILL.md`, Markdown under `docs/superpowers/`.

**Spec:** [`docs/superpowers/specs/2026-07-11-spec-driven-harness-design.md`](../specs/2026-07-11-spec-driven-harness-design.md)

## Global Constraints

- Cursor rules MUST be English (en-US) per `00-cursor-rules-language.mdc`.
- Do not mass-migrate legacy tests.
- Do not add CI “spec link” enforcement (phase 2).
- ADR rule `10` still applies when governance requires it; SDD does not replace ADRs.
- Keep each new rule concise (prefer under ~80 lines), one concern per file.
- Do not commit unless the user asks.

---

### Task 1: Specs/plans README conventions

**Files:**
- Create: `docs/superpowers/specs/README.md`
- Create: `docs/superpowers/plans/README.md`

**Interfaces:**
- Produces: naming convention `YYYY-MM-DD-<topic>-design.md` (specs) and `YYYY-MM-DD-<feature-name>.md` (plans); mini vs full; when plan is inline.

- [ ] **Step 1: Write `docs/superpowers/specs/README.md`**

```markdown
# Specs (Spec-Driven Development)

Design specs live here. Agents write them **before** implementation.

## Naming

`YYYY-MM-DD-<topic>-design.md`

## Mini vs full

| Kind | When | Minimum |
|------|------|---------|
| **Mini** | Any change, including one-line | Intent, Done when, Out of scope |
| **Full** | Multi-file / behavior / contracts | Context, Decisions, Goals, Non-goals, Workflow/architecture, Consequences, DoD |

## Gate

Do not edit product code until the user approves the written spec (or explicitly OKs the mini-spec).

See also: `.cursor/rules/29-spec-driven-development.mdc`, skill `spec-driven-development`.
```

- [ ] **Step 2: Write `docs/superpowers/plans/README.md`**

```markdown
# Implementation plans

Plans live here after the user approves a spec.

## Naming

`YYYY-MM-DD-<feature-name>.md`

## When required

- Separate plan file if the change spans **more than one** product file **or** changes behavior.
- Otherwise the plan may stay **inline** in the mini-spec (short bullet list).

Use Superpowers **writing-plans** structure (tasks with checkboxes, exact paths).

See also: `.cursor/rules/29-spec-driven-development.mdc`.
```

- [ ] **Step 3: Verify files exist and are non-empty**

Run: `wc -l docs/superpowers/specs/README.md docs/superpowers/plans/README.md`  
Expected: both files > 0 lines.

---

### Task 2: Rewrite `20-agent-preflight.mdc` as SDD Gate 0

**Files:**
- Modify: `.cursor/rules/20-agent-preflight.mdc` (full rewrite)

**Interfaces:**
- Consumes: Gate 0 mapping from the design spec.
- Produces: Preflight = mandatory SDD gate; no trivial skip; deliverable block drafts the spec.

- [ ] **Step 1: Replace file contents with this rule (English)**

```markdown
---
description: SDD Gate 0 — align and draft a written spec before any implementation; PREFLIGHT forces the mode.
globs:
  - "**/*"
alwaysApply: true
---

# Preflight = Spec-Driven Development Gate 0

## Goal

Before any implementation, align intent and produce (or update) a **written spec** under `docs/superpowers/specs/`. This rule is Gate 0 of Spec-Driven Development (see **`29-spec-driven-development.mdc`**). It does **not** replace **`complete-solutions-always.mdc`**.

## When Gate 0 is mandatory

**Always** for work that will edit the repo (product code, tests, config, rules, docs intended as deliverables)—including one-line and “trivial” changes. A **mini-spec** is enough for tiny work.

Also force this mode when the user includes **`PREFLIGHT`** or **`SPEC`**.

## Carve-out (read-only only)

The agent may explore with **read-only** tools to draft the spec without confirmation. **No** edits, patches, or mutating shell until the user approves the written spec (or mini-spec).

The only skip of Gate 0 is when the user message is purely conversational with **no** requested repo change.

## Mandatory deliverable (before touching files)

In **one** response, provide:

1. **Understanding** — 2–4 bullets.
2. **Assumptions and open questions** — what needs confirmation.
3. **Proposed plan** — steps and affected layers (this becomes the plan or plan outline).
4. **Risks and mitigation**
5. **Definition of done**

Then write or update:

`docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`

- **Mini** (tiny): Intent / Done when / Out of scope.
- **Full**: per design-spec template / brainstorming output.

**Stop** and wait for explicit approval (e.g. “go ahead”, “ok”, “yes”) before any edit.

## Alignment

- Auth / data / public contracts → also satisfy **`10-engineering-governance.mdc`** (ADR when required). The spec **references** the ADR; it does not replace it.
- **`990-tests-failure-confirmation.mdc`** still applies at commit/CI gates.
- Tests for new/touched code → **`30-harness-self-contained-tests.mdc`** + **`02-testing-tdd.mdc`**.

## Checklist

- [ ] Spec path on disk (mini or full)?
- [ ] User approved?
- [ ] Plan file or inline plan ready when scope > mini?
- [ ] Only then implement (TDD).
```

- [ ] **Step 2: Confirm no “skip for trivial” language remains**

Run: `rg -n "skip preflight|trivial" .cursor/rules/20-agent-preflight.mdc`  
Expected: no carve-out that skips Gate 0 for trivial product edits (mention of “trivial” only as “mini-spec is enough” is OK).

---

### Task 3: Add `29-spec-driven-development.mdc`

**Files:**
- Create: `.cursor/rules/29-spec-driven-development.mdc`

**Interfaces:**
- Consumes: Gate 0 from `20`; produces full SDD cycle for agents.

- [ ] **Step 1: Create the rule**

```markdown
---
description: Spec-Driven Development — written spec approval then plan then TDD; always for repo changes.
alwaysApply: true
---

# Spec-Driven Development (SDD)

## Iron law

**No implementation without an approved written spec** under `docs/superpowers/specs/`.

Violating the letter is violating the spirit. Do not “code first and document later.”

## Flow

1. **Gate 0** — `.cursor/rules/20-agent-preflight.mdc` (Understanding → … → DoD + draft spec).
2. **Spec on disk** — `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` (mini or full).
3. **User approval** of that file (or explicit OK of mini-spec).
4. **Plan** — `docs/superpowers/plans/YYYY-MM-DD-<feature>.md` when >1 file or behavior change; else short plan inline in the mini-spec.
5. **Implement** — TDD (`.cursor/rules/02-testing-tdd.mdc`, skill `tdd`); self-contained tests (`.cursor/rules/30-harness-self-contained-tests.mdc`).

## Skills

- **REQUIRED:** `.agents/skills/spec-driven-development/SKILL.md` when starting features/bugs/refactors.
- Superpowers: brainstorming (design) → writing-plans (after spec approval) → executing-plans or subagent-driven-development.

## Mini-spec minimum

- Intent
- Done when
- Out of scope

## Red flags — STOP

- Editing `src/` before a spec file exists
- “Too small for a spec”
- Spec only in chat, never written to `docs/superpowers/specs/`
- Implementing while “waiting” for approval

## Governance

When **`10-engineering-governance.mdc`** requires an ADR, create/update it and link it from the spec.
```

- [ ] **Step 2: Verify frontmatter `alwaysApply: true`**

Run: `head -5 .cursor/rules/29-spec-driven-development.mdc`

---

### Task 4: Add `30-harness-self-contained-tests.mdc`

**Files:**
- Create: `.cursor/rules/30-harness-self-contained-tests.mdc`

**Interfaces:**
- Complements `02-testing-tdd.mdc`; does not replace coverage/TDD protocol.

- [ ] **Step 1: Create the rule**

```markdown
---
description: Harness engineering — self-contained tests; each file owns mocks/fixtures; no order dependence.
alwaysApply: true
---

# Self-contained tests (harness engineering)

## Goal

Every **new or touched** test file under `src/__tests__/` (or `*.test.ts(x)`) must be understandable and runnable **alone**.

## Required

1. **Local setup** — `vi.mock`, fixtures, factories, and `beforeEach`/`afterEach` live in the same file, or come from an **explicit** import of a pure helper.
2. **No cross-file mutable state** — do not share module-level mutable data across test files.
3. **Order independence** — `npx vitest run path/to/file.test.ts` must pass in isolation.
4. **One primary subject** per file (one component, hook, or module).
5. **Mock at boundaries** — Supabase, Resend, `next/navigation`, etc. (see **`02-testing-tdd.mdc`**).
6. **Observable behavior** — Testing Library roles/labels; prefer dictionary keys / mocked dict over brittle DOM structure.

## Allowed

- Optional helpers under `src/__tests__/helpers/` with **no** product-domain global side effects.
- Explicit imports of shared dict/fixtures.

## Forbidden

- Depending on another test file having run first.
- Global `setupFiles` that mock product domains (neutral Vitest polyfills are OK).
- Implicit fixtures via path magic.

## Scope

- Enforce on **new and touched** tests. Do not mass-rewrite legacy tests in unrelated PRs.

## Skill

Use `.agents/skills/harness-self-contained-tests/SKILL.md` when writing or editing tests.
```

- [ ] **Step 2: Cross-link from `02-testing-tdd.mdc`**

Add under “Skills & layered architecture” or Rules section one bullet:

`Self-contained / isolation: **.cursor/rules/30-harness-self-contained-tests.mdc**`

---

### Task 5: Skill `spec-driven-development`

**Files:**
- Create: `.agents/skills/spec-driven-development/SKILL.md`

**Interfaces:**
- Triggered whenever starting implementation work; description must be “Use when…” only (no workflow summary in description per writing-skills SDO).

- [ ] **Step 1: Create skill directory and SKILL.md**

```markdown
---
name: spec-driven-development
description: Use when starting any feature, bugfix, refactor, or repo change before writing implementation code; also when the user mentions SPEC, PREFLIGHT, spec-driven, or asks for a design/spec/plan first.
---

# Spec-Driven Development

## Overview

Every repo change starts with a **written spec** the user approves. Preflight is Gate 0. Implementation follows TDD only after approval.

**REQUIRED BACKGROUND:** Superpowers brainstorming (design) and writing-plans (after spec approval). Repo rules: `20-agent-preflight.mdc`, `29-spec-driven-development.mdc`.

## Iron law

No implementation before an approved file under `docs/superpowers/specs/`.

## Steps

1. Run Gate 0 deliverable (Understanding → DoD).
2. Write mini or full spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
3. Stop for user approval.
4. If scope >1 file or behavior: write plan via writing-plans to `docs/superpowers/plans/`.
5. Implement with skill `tdd` + rule `30` for tests.

## Mini-spec template

```markdown
# <title>

**Intent:** …
**Done when:** …
**Out of scope:** …
```

## Red flags

- Coding before the spec file exists
- “Too small for a spec”
- Spec only in chat

## Related

- Harness tests: `harness-self-contained-tests`
- TDD: `tdd`
- Governance ADRs: `.cursor/rules/10-engineering-governance.mdc`
```

- [ ] **Step 2: Word count check**

Run: `wc -w .agents/skills/spec-driven-development/SKILL.md`  
Expected: under ~400 words for the body (keep concise).

---

### Task 6: Skill `harness-self-contained-tests`

**Files:**
- Create: `.agents/skills/harness-self-contained-tests/SKILL.md`

- [ ] **Step 1: Create SKILL.md**

```markdown
---
name: harness-self-contained-tests
description: Use when writing, editing, or reviewing Vitest/Testing Library tests; when tests share state, depend on run order, or need isolation; when the user mentions self-contained tests or harness engineering.
---

# Self-Contained Test Harness

## Overview

Each test file owns its mocks and fixtures. Shared helpers are optional and **explicitly imported**. Complements repo TDD (`02-testing-tdd.mdc`); rule: `30-harness-self-contained-tests.mdc`.

## Checklist (before marking tests done)

- [ ] File states subject under test at top
- [ ] All `vi.mock` calls visible in this file (or thin re-export helper imported here)
- [ ] `beforeEach` clears mocks / resets data
- [ ] Passes alone: `npx vitest run <path>`
- [ ] Asserts observable behavior, not private structure
- [ ] Mocks only external boundaries

## Pattern (RTL component)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MyWidget } from "@/components/.../MyWidget";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const dict = { save: "Save", cancel: "Cancel" };

describe("MyWidget", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls onSave when Save is pressed", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<MyWidget dict={dict} onSave={onSave} />);
    await user.click(screen.getByRole("button", { name: dict.save }));
    expect(onSave).toHaveBeenCalledOnce();
  });
});
```

## Anti-patterns

| Bad | Good |
|-----|------|
| Mutable `sharedDb` imported across files | Factory `makeDb()` per test |
| Relying on another file’s `beforeAll` | Local setup |
| Global product mocks in setupFiles | Per-file `vi.mock` |

## Related

- `tdd` skill for red → green → refactor
- Coverage gates remain in `02-testing-tdd.mdc`
```

- [ ] **Step 2: Verify skill is discoverable**

Run: `test -f .agents/skills/harness-self-contained-tests/SKILL.md && head -4 .agents/skills/harness-self-contained-tests/SKILL.md`

---

### Task 7: Update `AGENTS.md`

**Files:**
- Modify: `AGENTS.md` (workflow section + always-apply table)

**Interfaces:**
- Replace “skip trivial preflight” guidance with SDD Gate 0 + mini-spec.

- [ ] **Step 1: Replace the “Workflow: preflight” section** with:

```markdown
## Workflow: Spec-Driven Development (SDD)

**From now on**, every repo change starts with a **written spec** (mini or full) under [`docs/superpowers/specs/`](docs/superpowers/specs/), then user approval, then plan (when needed), then TDD.

- Gate 0 / preflight: **`.cursor/rules/20-agent-preflight.mdc`** (tags **`PREFLIGHT`** / **`SPEC`** force the mode).
- SDD cycle: **`.cursor/rules/29-spec-driven-development.mdc`** + skill **`spec-driven-development`**.
- Self-contained tests: **`.cursor/rules/30-harness-self-contained-tests.mdc`** + skill **`harness-self-contained-tests`**.
- Plans: [`docs/superpowers/plans/`](docs/superpowers/plans/).
- Nothing skips the written spec—even one-line changes use a **mini-spec** (Intent / Done when / Out of scope).
- Auth/data/public contracts still need ADRs when **`10-engineering-governance.mdc`** applies.
```

- [ ] **Step 2: Update the always-apply table rows**

- Change `20-agent-preflight.mdc` description to: SDD Gate 0 — written spec before edits; `PREFLIGHT`/`SPEC`.
- Add rows for `29-spec-driven-development.mdc` and `30-harness-self-contained-tests.mdc`.

- [ ] **Step 3: Update “When in doubt” item 1** to point at SDD + `29` (not “skip preflight”).

---

### Task 8: Sanity verification

**Files:** none (verification only)

- [ ] **Step 1: List new artifacts**

Run:

```bash
ls -la \
  docs/superpowers/specs/README.md \
  docs/superpowers/plans/README.md \
  .cursor/rules/20-agent-preflight.mdc \
  .cursor/rules/29-spec-driven-development.mdc \
  .cursor/rules/30-harness-self-contained-tests.mdc \
  .agents/skills/spec-driven-development/SKILL.md \
  .agents/skills/harness-self-contained-tests/SKILL.md
```

Expected: all exist.

- [ ] **Step 2: Confirm AGENTS mentions SDD and both new rules**

Run: `rg -n "spec-driven|29-spec|30-harness|mini-spec" AGENTS.md`  
Expected: multiple hits.

- [ ] **Step 3: Confirm `20` no longer allows skipping for trivial edits**

Run: `rg -n "skip preflight|implement directly|narrow and obvious" .cursor/rules/20-agent-preflight.mdc`  
Expected: no matches (or only historical comments if any—prefer zero).

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Specs/plans folders + READMEs | 1 |
| Rewrite `20` as Gate 0, no trivial skip | 2 |
| Rule `29` | 3 |
| Rule `30` + link from `02` | 4 |
| Skill SDD | 5 |
| Skill harness tests | 6 |
| `AGENTS.md` | 7 |
| DoD verification | 8 |
| No CI phase 2 / no mass test migration | Global constraints |

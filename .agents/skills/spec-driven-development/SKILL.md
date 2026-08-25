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

Writing or updating files under `docs/superpowers/specs/` is allowed before approval; all other implementation edits wait.

**Mechanical gate:** Cursor hooks (`.cursor/hooks.json`) deny `Write` / `StrReplace` / `Delete` until `.cursor/sdd-gate0-approved` exists and references that spec. After the user approves, create the marker before editing `src/` or other implementation paths.

## Steps

1. Run Gate 0 deliverable (Understanding → DoD).
2. Write mini or full spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
3. Stop for user approval.
4. On approval, write `.cursor/sdd-gate0-approved` with `{ "spec": "docs/superpowers/specs/....md", "approvedAt": "<ISO>" }`.
5. If scope >1 file or behavior: write plan via writing-plans to `docs/superpowers/plans/`.
6. Implement with skill `tdd` + rule `30` for tests.
7. When implementation is done, commit spec + plan + implementation together (rule **`37`**). Do not leave it staged. If other WIP is in the tree, ask — never stash.

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
- Editing implementation without the approval marker (hooks will block)

## Related

- Harness tests: `harness-self-contained-tests`
- TDD: `tdd`
- Governance ADRs: `.cursor/rules/10-engineering-governance.mdc`
- Self-check: `node .cursor/hooks/sdd-gate0-self-check.mjs`

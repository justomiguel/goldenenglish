# SDD Gate 0 Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mechanically block agent file mutations until a Gate 0 spec exists and the user approval marker is present.

**Architecture:** Pure policy module (`decideGate0FileEdit` / `decideGate0ShellCommand`) decides allow/deny from path + marker + env. Thin Cursor hook scripts read stdin JSON and emit `{ permission }`. Approval marker `.cursor/sdd-gate0-approved` (gitignored) unlocks implementation paths after explicit user OK.

**Tech Stack:** Node.js ESM scripts, Cursor `preToolUse` / `beforeShellExecution` hooks, Vitest for policy unit tests.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-11-sdd-gate0-enforcement-design.md`
- Always allow: `docs/superpowers/specs/**`, `docs/superpowers/plans/**`, marker
- Unlock: marker file + referenced spec must exist
- Escape: `SKIP_SDD=1` (documented; prefer ask user)
- No product UI changes
- English for `.cursor/rules/*.mdc`

---

### Task 1: Policy module + tests (TDD)

- [x] Write Vitest covering allow/deny/unlock/SKIP_SDD
- [x] Implement `.cursor/hooks/sdd-gate0-policy.mjs`
- [x] Run tests green

### Task 2: Hook scripts + hooks.json

- [x] Implement pre-tool-use and before-shell wrappers
- [x] Add `.cursor/hooks.json` with `failClosed: true` on write gate
- [x] `chmod +x` scripts
- [x] Add `.cursor/sdd-gate0-approved` to `.gitignore`

### Task 3: Self-check + docs

- [x] Implement `sdd-gate0-self-check.mjs`
- [x] Update rules `20` / `29` and SDD skill
- [x] Write approval marker for this approved spec
- [x] Run self-check + vitest

### Task 4: Verify

- [x] `npx vitest run src/__tests__/cursor/sdd-gate0-policy.test.ts`
- [x] `node .cursor/hooks/sdd-gate0-self-check.mjs`

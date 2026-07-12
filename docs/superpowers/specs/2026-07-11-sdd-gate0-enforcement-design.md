# SDD Gate 0 — hard enforcement (hooks)

**Intent:** Make Spec-Driven Development Gate 0 mechanically enforceable so the agent cannot edit product/implementation files until a written spec exists under `docs/superpowers/specs/` (and, for full flow, until the user has approved it). Today rules `20-agent-preflight.mdc` and `29-spec-driven-development.mdc` are advisory only; there is no project `.cursor/hooks.json`, so agents routinely skip writing the spec and go straight to code.

**Done when:**

1. Project hooks under `.cursor/hooks.json` + scripts block mutating tool calls (`Write`, `StrReplace`, `Delete`, and mutating `Shell` that edits files) targeting implementation paths when Gate 0 is not satisfied.
2. Edits to `docs/superpowers/specs/**` remain allowed without prior approval (Gate 0 drafting).
3. Read-only exploration (`Read`, `Grep`, `Glob`, non-mutating shell) remains allowed.
4. An explicit unlock path exists after user approval (e.g. session marker file or approval token under `.cursor/` / `docs/superpowers/`) so implementation can proceed once the user says go.
5. Rules `20` / `29` and skill `spec-driven-development` document the hook contract (what is blocked, how to unlock).
6. A small self-check (script or documented manual trigger) proves deny-then-allow behavior.

**Out of scope:**

- Changing product UI or app runtime behavior.
- Blocking Tab/autocomplete edits (agent-only gate is enough for v1).
- Perfect detection of every mutating shell (`sed`, `perl -i`, etc.) beyond a practical heuristic.
- Relying solely on stronger prose in `.mdc` without a hook.

## Context

- Rules already mandate Gate 0 (`alwaysApply: true`).
- No `.cursor/hooks.json` exists in this repo → nothing blocks `Write`/`StrReplace` to `src/`.
- Cursor `preToolUse` can return `{ "permission": "deny", "agent_message": "..." }` for `Write` / `StrReplace` / `Delete` (and optionally `Shell`).

## Decision (proposed)

1. Add **project** hooks:
   - `preToolUse` matcher `Write|StrReplace|Delete` → script that allows only Gate-0-safe paths; denies implementation edits when locked.
   - Optional `beforeShellExecution` / `preToolUse` Shell matcher for common mutating patterns.
2. **Lock state:** default locked for implementation paths. Unlock when:
   - Spec file exists for the active work **and**
   - Approval marker is present (written when user approves — agent creates `.cursor/sdd-gate0-approved` or similar after explicit user OK; or user-facing command).
3. **Always allow:** `docs/superpowers/specs/**`, and optionally `docs/superpowers/plans/**` after unlock or for plan drafting with a narrow allowlist.
4. Document escape hatch: conversational / no-repo-change messages need no unlock; `SKIP_SDD=1` or user override only if product owner insists (prefer ask, not silent skip).

## Options considered

| Option | Pros | Cons |
|--------|------|------|
| A. Stronger rules only | Cheap | Already failing in practice |
| B. Hooks block until any recent spec exists | Simple | Weak — old specs unlock forever |
| C. Hooks + session approval marker after user OK | Matches SDD flow | Needs agent/user to set marker |
| D. Prompt-only hook | Flexible | Non-deterministic |

**Chosen:** C (hooks + approval marker), with allowlist for writing new/updated specs anytime.

## Consequences

- Agents that jump to `src/` get a deny + `agent_message` telling them to write/update the spec and wait for approval.
- False positives possible on shell file mutation; mitigate with clear allow for read-only git/status and documented failClosed behavior.
- Team must know: after “go ahead”, create/refresh the approval marker tied to the spec path.

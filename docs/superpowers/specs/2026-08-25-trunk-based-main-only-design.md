# Trunk-based development — `main` only

**Intent:** Remove leftover isolation (worktree, feature branch, stashes, WIP tags) and make the existing “work on `main`” rule explicitly **trunk-based development**.

**Done when:**

- Git has only `main` as a local branch; no linked worktrees, no `feat/admin-ops-reskin`, no stashes, no `wip/*` tags.
- `.cursor/rules` names trunk-based development and forbids feature branches / worktrees / isolation stashes unless the user overrides in the message.
- `AGENTS.md` and `foundation-rules.mdc` point at that rule.

**Out of scope:** Pushing `main`; changing CI; deleting `.worktrees/` from `.gitignore` (the ignore stays so a future override cannot pollute lint).

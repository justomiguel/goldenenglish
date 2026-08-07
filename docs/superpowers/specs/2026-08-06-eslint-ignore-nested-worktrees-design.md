# ESLint ignores nested git worktrees

**Date:** 2026-08-06
**Status:** Approved
**Kind:** Mini-spec
**Related:** `eslint.config.mjs`, `.gitignore`, `.husky/pre-commit`

## Intent

`npm run lint` walks into `.worktrees/<branch>/`, a nested checkout of this same
repository used for agent and feature isolation. It then reports errors for that
checkout's vendored files — skill scripts, Playwright helpers, reference TypeScript —
and fails. Because the precommit gate is fail-closed, this blocks every commit in the
main checkout, for a reason that has nothing to do with the change being committed.

Observed on 2026-08-06: 18 errors, all under
`.worktrees/feat-edit-section-name/.agents/**` and that checkout's `e2e/**`.

Adding `.worktrees/` to `.gitignore` does not help. ESLint's flat config does not read
`.gitignore`; `eslint.config.mjs` declares an explicit `globalIgnores` list instead.

A nested worktree is a separate checkout with its own branch, its own lifecycle and its
own lint runs. Linting it from here is always wrong, whoever created it.

## Change

Add `".worktrees/**"` to the `globalIgnores` list in `eslint.config.mjs`, next to
`".agents/**"`, which is ignored for the same reason.

## Done when

1. `npm run lint` reports no errors originating under `.worktrees/`.
2. A commit in the main checkout succeeds while a nested worktree exists.
3. Lint coverage of the main checkout is unchanged: no file outside `.worktrees/`
   stops being linted.

## Out of scope

- Removing or pruning the existing `.worktrees/feat-edit-section-name` checkout. It holds
  four committed commits on `feat/edit-section-name` and may belong to a live session.
- The `.gitignore` entry for `.worktrees/`, already added. It is correct for git and
  simply does not govern ESLint.
- Making ESLint read `.gitignore` via `includeIgnoreFile`. Larger behavior change than
  this problem needs, and it would silently alter which files are linted.

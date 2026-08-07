# Admin tutorials — split files over 250-line limit

**Date:** 2026-07-24  
**Status:** Approved (precommit architecture gate)  
**Type:** Mini-spec

## Intent

Split six `src/lib/admin-tutorials/**` modules that exceed the 250-line architecture limit so precommit passes, with no behavior changes.

## Done when

1. Every resulting `.ts`/`.tsx` under `src/` that this change touches is ≤250 lines.
2. Public exports from original paths still work (re-export barrels where needed).
3. `node scripts/precommit-verify.mjs` no longer reports architecture line-count errors for these files.
4. `npx vitest run src/__tests__/lib/admin-tutorials/` stays green.

## Out of scope

- Tour copy, anchors, catalog IDs, or Driver.js behavior changes.
- Refactors outside `src/lib/admin-tutorials/`.

# Admin messages: sticky bulk actions visibility

**Intent:** When the admin selects one or more messages, **bulk actions** (mark read / unread, delete, clear) must stay **visible without scrolling away** from the rows being selected. Today the bar sits above the list (under folder counts), so selecting lower rows hides the actions off-screen.

**Done when:**

1. With `selectedCount ≥ 1`, a clear action strip is **sticky** within the messages panel (or fixed under the folder tabs) with solid surface + border so it reads as a toolbar — not a quiet inline row that scrolls away.
2. Actions remain: select-all / clear, count, mark read/unread (inbox), delete (+ confirm), clear selection.
3. Existing Vitest for `AdminMessagesBulkBar` updated for sticky/presentational contract; no server/API change.
4. Manual QA (user): select rows mid-list → actions stay in view; clear → strip collapses to select-all only.

**Out of scope:** Floating FAB, keyboard shortcuts, mobile Tier A redesign.

## Understanding

- Selection + bulk actions already work; visibility/placement is the bug.
- User feedback: “no veo las acciones cuando selecciono”.

## Plan

1. Restyle `AdminMessagesBulkBar` as a sticky toolbar (`sticky top-0 z-10` + surface/border/padding) when selection is non-empty; keep select-all when empty.
2. Optionally move the bar to sit **immediately above the list** (already is) and ensure sticky sticks inside the scroll parent used by admin chrome.
3. Tests: assert sticky container / role toolbar when selected.

## Risks

Sticky fails if an ancestor has `overflow: hidden` — check `AdminMessagesTabs` section; relax overflow on the list panel if needed.

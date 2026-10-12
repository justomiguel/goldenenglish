# ADR: Home popup for opted-in events

## Context

Staff want a published event to be the first thing a visitor sees on the public home, and a carousel when several events are marked. The home is shared by every tenant template. Interrupting every visit with every published event would be noisy, and stacking one dialog per event traps focus.

## Decision

Add `events.show_on_home` (default false). The home opens one dialog for events that are marked, published, not archived, not `private_to_section`, and still upcoming (at most 8, soonest first). Several events share one carousel with manual previous/next. Close, Escape, and the backdrop dismiss that set for the browser session (`sessionStorage`). A changed set shows the dialog again.

## Options considered

- Show every published event with no flag. Rejected: staff choose which events interrupt the home.
- One dialog per event. Rejected: stacked dialogs hide the close control.
- Auto-advancing slides. Rejected: a manual carousel avoids motion that the visitor cannot pause.

## Consequences

- Existing events stay off the home until an admin opts in.
- Past and section-private events drop out of the query even if the flag stays on.
- Admin saves write `system_config_audit` (`event_show_on_home_updated`). The dialog reuses `click` analytics with `surface: "home_popup"`.
- Tests cover eligibility, session dismissal, and the dialog chrome.

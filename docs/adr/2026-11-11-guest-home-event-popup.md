# Guest home shows a shared event popup

## Context

An approved share puts the owner event on the guest public list. `show_on_home` used to open the popup only on the owner home. A family on the guest site never saw that dialog.

## Decision

The guest home popup includes each approved owner event that is published, public, not archived, marked `show_on_home`, and still upcoming. A non-archived local event with the same slug hides the shared row. The combined list stays at eight events, soonest first.

## Options considered

Copy `show_on_home` into the guest database. Rejected. The flag would drift from the owner row.

Show every shared event, even when the owner left the popup off. Rejected. The owner already chooses which events open on the home.

## Consequences

The home loader reads the owner event with the owner service role, the same way the guest event list does. Local popup behavior stays. Tests cover the merge rules.

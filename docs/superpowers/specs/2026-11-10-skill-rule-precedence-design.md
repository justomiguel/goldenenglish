# Skill rule precedence

## Intent

Keep product rules in force when a design skill disagrees. Split chat voice from persisted English. Let the agent check the flow it just changed. Leave tenant smoke, tours, and Lighthouse with the user.

## Done when

- `41-asd-ste100-english.mdc` applies to persisted English. A user voice rule controls the chat reply. With no voice rule, replies use `41`.
- `32-manual-qa-user-owned.mdc` allows a bounded check of the changed flow and of routes that share that state. Tenant smoke, tours, and Lighthouse stay user-owned.
- `foundation-rules.mdc` and the `32` row in `AGENTS.md` say the same thing.
- `01-design-system.mdc` and `44-no-ai-slop-design.mdc` name the design skills that do not choose font, palette, icon, photo, or motion.

## Out of scope

- Removing duplicate skill copies.
- Loosening `09`, `16`, `40`, `47`, or `50`.
- A new design system, token file, or visual change.

# Specs (Spec-Driven Development)

Design specs live here. Agents write them **before** implementation.

## Naming

`YYYY-MM-DD-<topic>-design.md`

## Mini vs full

| Kind | When | Minimum |
|------|------|---------|
| **Mini** | Any change, including one-line | Intent, Done when, Out of scope |
| **Full** | Multi-file / behavior / contracts | Context, Decisions, Goals, Non-goals, Workflow/architecture, Consequences, DoD |

## Gate

Do not edit product code until the user approves the written spec (or explicitly OKs the mini-spec).

See also: `.cursor/rules/29-spec-driven-development.mdc`, skill `spec-driven-development`.

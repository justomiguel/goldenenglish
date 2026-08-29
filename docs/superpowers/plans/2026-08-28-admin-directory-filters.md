# Admin Directory Filters Implementation Plan

> **For agentic workers:** Execute inline in this session (user asked to implement). TDD. Do not commit unless asked.

**Goal:** Collapsible faceted filters on Alumnos, Profes, and Padres, with parent bulk actions matching the visible list.

**Architecture:** Pure parse/match/facet helpers; locked-role pages load facts once, filter in memory, paginate; shared `AdminDirectoryFilterPanel`.

**Tech Stack:** Next.js App Router, Vitest, existing admin users directory.

## Global Constraints

- 250-line file ceiling
- es / en / pt, no hardcoded UI
- Self-contained Vitest, no live Supabase
- No migrations
- Faceted counts (other filters + `q`)

# Event minor maximum age legend

> **For agentic workers:** Execute inline in this session. The user approved the spec.

**Goal:** Staff set the inclusive maximum age for a minor ticket, and the public event page and registration form show that age.

**Architecture:** A pure helper accepts or rejects the age and fills a dictionary template. The pricing save persists `events.minor_max_age`. Public pages read that column and pass the finished sentence into the existing hint and price panel.

**Tech Stack:** Next.js App Router, Vitest, Postgres migration `263_event_minor_max_age.sql`.

## Global Constraints

- Age is an integer from 1 to 99, inclusive.
- A null age keeps the current registration sentence. The public price block adds no line.
- The system does not reject a birth date.
- Copy lives in `en.json`, `es.json`, and `pt.json`. Spanish uses tuteo.
- Public registration is Tier A. Desktop and PWA share `EventRegisterForm` and `PublicEventDetailPanel`.

## Tasks

1. Pure helper `src/lib/events/formatEventMinorAgeLegend.ts` plus tests.
2. Migration, `masterdb.sql`, duplicate plan, loaders, and `updateEventAction`.
3. Admin number field and public legend on the event page and the registration hint.
4. ADR and changelog entry.

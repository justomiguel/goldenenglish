# Mozarthitos FAQ metrics

**Intent:** Staff see how many people reach the Mozarthitos questions, and which question each person opens.

**Done when:**

- A person who sees the question list counts once per day.
- A person who opens a question counts once per day for that question id.
- The admin home shows one card with the 30-day people total and one row per question, with the question text and the open count.
- Only an admin on the Mozarthitos theme sees that card. Other institutes do not.
- The row does not store a name, an email, or an IP.
- A second open of the same question on the same day does not raise the count.

**Out of scope:**

- Do not count the whole site. Home traffic already lives in the guest path list.
- Do not count a click inside the answer text.
- Do not add a new event type to `user_events`. That ingest returns 401 without a session. These readers are guests.
- Do not change the accordion layout.
- Do not add a shared home widget. Other institutes must not be able to turn this card on.

## Cause

The questions sit on the home contact block, the contact page, and `/preguntas`. `POST /api/analytics/events` stores a row only when `auth.getUser()` returns a user. A family that is not signed in never appears there.

## Decision

Follow the blog metric pattern (`record_blog_metric` plus a visitor cookie).

1. New table `public.faq_metric_events`. Columns: `kind` (`visit` or `open`), `question_id` (null on a visit, the stable id on an open), `day`, `dedupe_key`. Unique on `dedupe_key`.
2. RPC `record_faq_metric` is `SECURITY DEFINER`. It inserts one row and returns on a duplicate key. It accepts only the 16 Mozarthitos question ids on an open. A visit has a null question id.
3. RPC `faq_admin_stats_30d` returns the visit total and the open count per question id for the last 30 days. Only an admin session can read it.
4. `POST /api/faq/metrics` sets an httpOnly cookie `ge_faq_vid` and sends a hashed dedupe key. `Cache-Control: private, no-store`.
5. The accordion sends `visit` when it mounts. It sends `open` when a `<details>` opens. The id is the dictionary id (`price`, `programs`, and the rest).

One person who opens the home block and `/preguntas` on the same day is still one visit. The cookie is the person key. A new day, or a cleared cookie, counts as another person.

## Surfaces (Web vs PWA)

The public pages are Tier A. One accordion serves the home contact block, the contact page, and `/preguntas`. There is no second file under `src/components/pwa/`. The same mount and the same toggle send the metric on `web-desktop`, `web-mobile`, and `pwa-mobile`.

The admin home is Tier B. The card is a fixed block above the home grid. It is not a catalog widget. The phone layout of that home already exists. The card stays full width there. It does not change a PWA tree.

The theme check lives in `src/variants/owned/mozarthitos/`. Shared code does not compare the slug.

## Admin copy

The section title and the empty state go in `en.json`, `es.json`, and `pt.json`. Spanish uses tuteo. The question sentence comes from `publicAnswers.kinds.mozarthitos`. An unknown id shows the raw id.

## Tests

- The route returns 400 for an unknown question id and does not call the RPC.
- A visit sends a null question id.
- The accordion test opens one `<details>` and posts `open` with that id.
- The stats parser maps the RPC payload to the rows the card renders.
- A theme that is not Mozarthitos returns no card and does not call the stats RPC.
- The card shows `load_failed` and `stats_unavailable` as their own sentences. An unknown code stays visible.

## ADR

Ship `docs/adr/2026-11-19-faq-metric-events.md` with this change. The public route and the new table are a data contract.

## Manual QA (user)

Open the contact block, open two questions, reload, and open the first question again. The Mozarthitos admin home shows one visit and two opens. Another institute home does not show the card.

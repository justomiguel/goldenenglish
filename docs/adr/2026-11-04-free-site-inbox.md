# Free-site visitor inbox

## Context

A free-site contact form emails the owner and then drops the text. The owner has no list of messages.

## Decision

Store each accepted message on the Pulsar control plane in `platform_free_site_messages`. The institute database does not hold these rows. The service role writes them. The owner reads them through a server page that filters by owned slugs.

## Options considered

- Store the rows on each institute database. Rejected. The owner account lives on Pulsar and may not open that database.

## Consequences

- Migration `supabase/pulsar-migrations/016_platform_free_site_messages.sql` must run on the Pulsar database.
- A mail failure after a successful insert still leaves the message in the inbox.
- Tests cover the save call and the page range. The inbox page is manual QA for the owner.

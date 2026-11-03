# Daily rooms per institute section

## Context

A section class can be in person, hybrid, or remote. Hybrid and remote classes need a private video room. Each institute brings its own Daily account. CentroListo does not share one Daily key across institutes.

The commercial plans Página, Gestión, and Ecosistema exist as landing copy. No institute row stores that plan today. `platform_tenant_owners.plan` only allows `free` for self-serve sites.

## Decision

Store `commercial_plan`, `daily_api_key`, and `daily_domain` on `platform_tenants`. CentroListo staff edit them in the Pulsar tenant form. The server reads them from the tenant registry. They never enter `TenantPublicEnv`.

Only `ecosistema` may set a section delivery mode other than in person. A hybrid or remote section gets one private Daily room per weekly schedule slot. The room is reused every week. The server issues a meeting token at join time. The token names that room and expires at the end of the join window.

## Options considered

One Daily domain for the whole platform, with room names prefixed by institute. Rejected. The user requires the API key on the institute record in Pulsar.

A new Daily room for each calendar date. Rejected. The section stores a weekly slot, not a row per date.

One room for every slot in the section. Rejected. Monday and Wednesday would share one link.

## Consequences

- A Pulsar migration adds the three columns. Existing institutes default to `gestion`.
- An institute migration adds `academic_sections.delivery_mode` and `section_daily_rooms`.
- Join is allowed for the section teacher and for a student with an active enrollment. A section assistant does not receive a token.
- Audit rows record that the plan, the key, or the mode changed. They do not store the key or the token.
- A successful token issue records a product `action` with the section id and the slot. The token stays out of the metadata.
- Vitest covers the window, the plan gate, the token denials, and the public-env boundary.

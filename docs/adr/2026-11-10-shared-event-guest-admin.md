# Shared event guest admin

## Context

One event can appear on another institute site. The visitor stays on the guest host. Purchases, receipts, and admin edits must land in the owner database. The guest user does not exist in the owner auth database.

## Decision

A guest admin may read and write one shared event only after an approved grant exists in CentroListo. The server opens the owner service role for that event id. The guest actor id is stored in the audit payload. The owner audit row uses a null actor id because `system_config_audit.actor_id` references the owner profiles table.

## Options considered

Copy the event into the guest database. Rejected. Two copies drift, and payment would leave the owner account.

Sign the guest user into the owner project. Rejected. The guest JWT is not a user in the owner auth database.

## Consequences

Public pages and admin mutations for a shared event use the owner client. Mail still follows the site where the person registered. CentroListo approve and reject rows go to `platform_audit_log`. Tests cover the grant rules and the failure sentence.

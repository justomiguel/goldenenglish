# Admin export of contact-form messages

## Context

Website contact-form messages already appear in Instituto → Mensajes. An admin can read name, email, phone, subject, and body there. There is no download. A bulk file contains the same visitor data.

## Decision

An admin session can download those messages as Excel or PDF. The admin chooses the columns and either every visible submission or the latest 2000 unique submissions. Copies that share `broadcast_batch_id` export as one row. The PDF header comes from the brand layer. `system_config_audit` records the format, the scope, the field ids, and the row count.

## Options considered

- Export the inbox array already on the page. Rejected. That array mixes internal mail and repeats each submission once per admin.
- Store subject and phone in new columns before export. Rejected. The existing HTML and email column already hold the values.

## Consequences

- The file can contain visitor email and phone. Only an admin session can create it. Logs and the audit payload omit that text.
- Choosing every message can make a large file. The same dialog offers the latest 2000.
- Tests cover parsing, dedupe, the admin gate, and the dialog payload.

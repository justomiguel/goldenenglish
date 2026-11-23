# CentroListo OpenAI key

The memory decision in this file is superseded by `docs/adr/2026-11-21-ai-provider-port.md`.

## Context

CentroListo and every client host must call OpenAI from the server. Staff save one platform key. The browser must not receive that key. A conversation must keep its turns until the owner deletes it. A later turn must not resend the whole transcript.

## Decision

Store one service-account key as AES-256-GCM ciphertext on Pulsar `platform_settings`. The prefix is `geoa:v1`. The encryption secret is `OPENAI_KEY_ENCRYPTION_SECRET` (32 raw bytes, base64). The panel shows whether a key exists and the last 4 characters.

Call the official Node SDK. Use the Responses API with the Conversations API. Store only the conversation pointer (`conv_…`) in `platform_openai_conversations`. Each later turn sends the new user message and that pointer. Compaction uses `compact_threshold` 200000. Delete lists items, deletes each item, then deletes the conversation.

Audit key save and clear in `platform_audit_log`. Do not write the key in the audit payload. Record a turn in `user_events` with entity `openai_conversation`. Metadata is the CentroListo conversation id only.

## Options considered

- Read `OPENAI_API_KEY` from the environment. Rejected. Staff must change the key without a deploy.
- Chat Completions plus a stored transcript. Rejected. That resends a megaprompt and loses the official conversation.
- `previous_response_id`. Rejected. Response objects expire. The user asked for memory until an explicit delete.
- `DELETE /conversations/{id}` alone. Rejected. Official docs say that call does not delete the items.

## Consequences

- Text stays at OpenAI until items are deleted. Conversations API is not Zero Data Retention eligible.
- Prior tokens still bill as input until compaction runs.
- A missing or wrong-length encryption secret returns `openai_encryption_unavailable` and does not write.
- The browser never receives the key or `conv_…`.
- This slice has no chat screen. Later chat screens call the same server functions.
- Tests use a fake key. They do not call OpenAI and they do not contain a live secret.

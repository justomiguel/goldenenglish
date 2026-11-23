# CentroListo OpenAI key and conversation memory

Superseded by `docs/superpowers/specs/2026-11-21-ai-provider-port-design.md`. OpenAI is one provider. Azure AI is another. Conversation memory belongs to the system.

## Intent

Staff save one OpenAI API key in the CentroListo admin. The key is encrypted at rest. The browser never receives it. Server code calls OpenAI with the official SDK and the Responses API. A conversation keeps every turn until the owner deletes it. Each new turn sends only the new question. OpenAI stores the thread. The call works for centrolisto.cl and for every client host, because the browser does not hold the key.

## Done when

- The Operator area of `/[locale]/admin` has a key field. Staff see whether a key exists and the last 4 characters. The field is empty on load.
- Save replaces the key. Clear removes it. Both write `platform_audit_log` without the key. That is the CentroListo control-plane audit. `system_config_audit` is the institute table, so this save does not use it.
- The stored value is AES-256-GCM ciphertext. The encryption key is `OPENAI_KEY_ENCRYPTION_SECRET` (32 bytes, base64). It stays in the environment. It is not a column and not a `NEXT_PUBLIC_` variable.
- A test button calls `models.list()` on the server and shows model ids, including GPT models when the account has them. It does not send the key back.
- `startPlatformOpenAiConversation` creates an OpenAI conversation and a pointer row. `sendPlatformOpenAiTurn` sends only the new user text plus that conversation id. `listPlatformOpenAiTurns` reads items from OpenAI. `deletePlatformOpenAiConversation` deletes every item, then the conversation, then marks the pointer deleted.
- A turn uses `context_management: [{ type: "compaction", compact_threshold: 200000 }]`. 200000 is the value in the official compaction example.
- Each failure has its own code and its own sentence in `en.json`, `es.json`, and `pt.json`. The log uses the same code and the OpenAI `request_id`. The log does not contain the key, the prompt, or the reply.
- `docs/adr/2026-11-21-centrolisto-openai-key.md` records this vendor choice and the memory choice.

## Surfaces (Web vs PWA)

Tier B — desktop-only for the key screen (no PWA tree).

The key screen is `src/app/[locale]/admin/page.tsx` and `PulsarAdminFleetScreen`. There is no `src/components/pwa` twin for that screen.

This slice does not add a chat screen. The conversation functions live in `src/lib/ai/providers/openai/` and take the session actor as an argument. They do not import a desktop or PWA component. A later student or parent chat is Tier A and must call these functions. It must not keep a second copy of the thread. A later staff-only chat may stay desktop-only.

## Official contract

Sources checked on 2026-11-21:

- https://developers.openai.com/api/reference/overview
- https://developers.openai.com/api/docs/guides/api-keys
- https://developers.openai.com/api/docs/guides/production-best-practices
- https://developers.openai.com/api/docs/guides/conversation-state
- https://developers.openai.com/api/docs/guides/compaction
- https://developers.openai.com/api/docs/guides/your-data
- https://developers.openai.com/api/docs/libraries
- https://developers.openai.com/api/reference/typescript

Rules we follow:

1. Authenticate with `Authorization: Bearer`. The official SDK sets that header. Pass `apiKey` from the decrypted column. Do not read `OPENAI_API_KEY` from the environment for this call.
2. Use the Responses API (`client.responses.create`). The docs name it the primary API for model requests. Do not add Chat Completions as the product path.
3. Keep the SDK off the browser. Do not set `dangerouslyAllowBrowser`.
4. The key staff paste is a project service-account key from the OpenAI dashboard. A personal user key is the wrong identity for this app. This app does not call the Admin API and does not store an Admin API key.
5. Log `_request_id` from the SDK on failure. That value comes from `x-request-id`.
6. Do not hardcode a model id. The quickstart examples name different models. `models.list()` shows the models this key can use. The caller passes `model` when the conversation starts. Later turns use the model stored on that row.
7. Memory uses one strategy: the Conversations API. Do not also send `previous_response_id` or a replayed history on the same turn.
8. OpenAI does not bind a secret API key to a browser origin. A server call from any host uses the same key. No domain allowlist is required.

## Memory

OpenAI does not remember a CentroListo user by itself. Each Responses call is empty unless it belongs to a conversation.

We use the Conversations API because its items stay until deleted. They do not expire after 30 days. `previous_response_id` expires after 30 days, and the next turn would need the full thread again. Replaying the thread ourselves is the megaprompt this design avoids.

What we store is the pointer. What OpenAI stores is the text.

1. `client.conversations.create()` returns `conv_…`.
2. Insert one row in Pulsar `public.platform_openai_conversations`.
3. The first turn may send one developer message from `instructions`, then the user message. Set `instructions_sent` after that call succeeds.
4. Every later turn sends only the new user message and `conversation: conv_…`.
5. The same call sets `context_management` so OpenAI compacts the thread when the rendered token count crosses 200000. The compaction item stays inside the conversation. We do not build or store that summary.
6. To show the thread, call `client.conversations.items.list` with `limit` from 1 to 100 and follow `has_more`. Return id, role, and text. Do not return tool payloads or encrypted compaction text.
7. Prior items still count as input tokens until compaction runs. Do not copy the thread into our database to avoid that.

`DELETE /conversations/{id}` does not delete items. A real delete does all of the following, in order:

1. List every item, page by page.
2. Delete each item with `DELETE /conversations/{id}/items/{item_id}`.
3. Delete the conversation.
4. Set `deleted_at` on our row.

If an item delete fails, stop. Return `openai_delete_incomplete`. Leave `deleted_at` null. The owner can retry.

Conversation items are not eligible for Zero Data Retention. The text remains at OpenAI until the item delete succeeds. Abuse-monitoring logs for `/v1/conversations` also last until deletion. Do not send this traffic with `store: false`. That flag fights this memory choice.

## Data

New Pulsar migration on `public.platform_settings`:

- `openai_api_key_cipher text null`
- `openai_api_key_last4 text null`

`platform_settings` already has no anon or authenticated RLS policy. Only `service_role` reads it. The cipher format is `geoa:v1:<iv>:<tag>:<cipher>`, base64 parts, AES-256-GCM, 12-byte IV. A new module owns that format. Do not reuse the payment prefix `gegw:v1`.

The last-4 value is the only key fragment the page may render. Decrypt only inside server modules that call OpenAI or that save a new key.

New Pulsar table `public.platform_openai_conversations`:

- `id uuid primary key`
- `host text not null`
- `owner_user_id uuid not null`
- `model text not null`
- `openai_conversation_id text not null`
- `instructions text null`
- `instructions_sent boolean not null default false`
- `created_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Index the active rows by `host`, `owner_user_id`, and `created_at desc`. No anon or authenticated policy. The server matches the session user and the request host. The browser never receives `openai_conversation_id`.

A list of one owner's conversations uses `range`, a page of 50, and an exact count. This table can grow. Do not use `select("*")`.

## Admin behavior

Same session gate as the operator password: `getPulsarStaffSession()`, and reject `mustChangePassword` with `unauthorized`.

Save:

1. Reject an empty value (`openai_key_empty`).
2. Trim. Accept only `sk-` plus letters, digits, `_`, and `-`, length 20 to 300 (`openai_key_invalid`).
3. If `OPENAI_KEY_ENCRYPTION_SECRET` is missing or not 32 bytes, return `openai_encryption_unavailable`. Do not store plaintext.
4. Write the cipher and the last 4 characters.
5. `revalidatePath` for `/${locale}/admin`. The client calls `router.refresh()`.

Clear sets both columns to null.

Test:

1. If no cipher, return `openai_key_missing`.
2. Build the official client and call `models.list()`.
3. Return at most 40 model ids. Do not return the key.

## Conversation behavior

These functions live under `src/lib/ai/providers/openai/` and import `server-only`. The actor is `{ host, userId }` from the server session. Do not accept that pair from the browser as proof of identity.

`startPlatformOpenAiConversation({ actor, model, instructions? })`

- `model` is a non-empty string, max 80.
- `instructions` is optional, max 8000.
- Success returns our conversation id. It does not return `conv_…`.

`sendPlatformOpenAiTurn({ actor, conversationId, text })`

- Load the active row for that id, host, and user. A missing or deleted row returns `openai_conversation_missing`. Another owner returns `openai_conversation_forbidden`.
- `text` is non-empty, max 32000.
- Call `responses.create` with the stored model, the OpenAI conversation id, and the new user text. Include the developer message only when `instructions_sent` is false.
- Success returns `{ ok: true, outputText, responseId, requestId }`.
- Record `user_events` with type `action` and entity `openai_conversation`. Metadata is our conversation id only.

`listPlatformOpenAiTurns({ actor, conversationId, after? })`

- Same owner check.
- Return one OpenAI page, at most 100 items, plus `hasMore` and `lastId`.

`deletePlatformOpenAiConversation({ actor, conversationId })`

- Same owner check, then the delete order in Memory.
- Record the same `action` event with metadata `{ conversationId, deleted: true }`.

Map SDK errors:

| Cause | Code |
|---|---|
| No stored key | `openai_key_missing` |
| Encryption secret missing | `openai_encryption_unavailable` |
| Cipher cannot be decrypted | `openai_key_corrupt` |
| HTTP 401 | `openai_key_rejected` |
| HTTP 403 | `openai_forbidden` |
| HTTP 404 on a model call | `openai_model_not_found` |
| HTTP 429 | `openai_rate_limited` |
| Unmapped HTTP status | the status number, as text |
| Network failure with no status | `openai_unavailable` |
| Empty model, empty text, or a value over the max length | `openai_input_invalid` |
| Empty `output_text` | `openai_empty_output` |
| Row missing or already deleted | `openai_conversation_missing` |
| Actor does not own the row | `openai_conversation_forbidden` |
| Item delete stops early | `openai_delete_incomplete` |

An unknown code stays visible as the raw code. Sentences name the cause and the next step. They include the code.

## Options considered

- Environment variable only. Rejected. Staff must change the key without a deploy. The encryption secret stays in the environment because the process cannot decrypt without it.
- Chat Completions as the main path. Rejected. OpenAI names the Responses API as the primary surface.
- Browser SDK. Rejected. The official library disables the browser so the secret stays off the client.
- Workload identity federation. Rejected for this slice. It needs an identity provider OpenAI already supports. This app does not have one. A stored service-account key is the documented application credential.
- `previous_response_id` as memory. Rejected. OpenAI keeps those responses for 30 days. After that, the caller must send the whole thread.
- Replaying every turn from our database. Rejected. That is the megaprompt. It also stores student and family text in our database when OpenAI already keeps the thread.
- Mixing Conversations with `previous_response_id` on the same turn. Rejected. The docs say to pick one strategy per conversation.

## Out of scope

- A chat screen, streaming UI, or a feature that writes site copy.
- A key per institute.
- `OpenAI-Organization` and `OpenAI-Project` headers.
- Admin API keys, project creation, or key rotation inside OpenAI.
- Reading `OPENAI_API_KEY` from the environment as a fallback.
- A second stored transcript in Postgres.
- Zero Data Retention.

## Tests

- Cipher round-trip, wrong key, and a truncated payload.
- Key parser: empty, bad prefix, valid `sk-proj-` value. The assertion uses a fixture, not a live secret.
- Save writes ciphertext and last 4, and does not return the key. Audit payload has no key.
- Test action returns model ids from a mocked SDK and never the key.
- Start stores a pointer and does not return `conv_…`.
- The second turn sends only the new user text and the conversation id. It does not send the earlier text.
- The first turn sends `instructions` once. The second turn does not send them again.
- Delete lists items, deletes each item, deletes the conversation, and then sets `deleted_at`. A failed item delete leaves `deleted_at` null and returns `openai_delete_incomplete`.
- `sendPlatformOpenAiTurn` maps 401, 429, and an unknown status. The unknown path keeps the raw code.
- A dictionary test fails if a known code renders a generic sentence.

## Manual QA (user)

- Paste a service-account key on the CentroListo admin. Reload. Confirm the field is empty and the last 4 match.
- Run the test. Confirm model ids appear.
- Open one client host. Confirm the admin page there is a different product and does not show this key.

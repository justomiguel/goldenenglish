# AI provider port and system conversation memory

Supersedes the provider coupling in `docs/superpowers/specs/2026-11-21-centrolisto-openai-key-design.md`. The Operator screen, the encrypted key, and the audit rules in that file stay. This file moves them behind a provider port.

## Intent

CentroListo talks to a language-model port. OpenAI is one provider. Azure AI is another provider. A later provider is the same kind of adapter. The product does not import a vendor SDK.

A conversation remembers every turn until the owner deletes it. That memory is a system capability. OpenAI Conversations is only how the OpenAI adapter fills that capability. If a provider has no thread API, the system stores the turns and sends a bounded window.

## Done when

- Use cases under `src/lib/ai/` call ports. They do not import `openai` or an Azure SDK.
- `composeAi.ts` is the only composition root. It picks the adapter from the provider row.
- OpenAI is an adapter in `src/lib/ai/providers/openai/`. It uses the official SDK, the Responses API, and Conversations when the thread mode is `provider_thread`.
- A fake provider with no thread API passes the same use-case tests through `system_log`.
- The kind union is `openai | azure`. This slice implements the OpenAI adapter. The Azure adapter is a later slice. The factory returns `ai_provider_unsupported` for `azure` until that slice exists.
- Staff can save more than one provider. Each service points at one enabled provider. The only service in this slice is `conversation`.
- Disabling the bound provider returns `ai_provider_disabled`. Binding another enabled provider does not rewrite old threads.
- The Operator screen still shows an empty key field and the last 4 characters. It lists providers and the conversation binding.
- `docs/adr/2026-11-21-ai-provider-port.md` records this decision. It supersedes the memory decision in `docs/adr/2026-11-21-centrolisto-openai-key.md`.

## Surfaces (Web vs PWA)

Tier B — desktop-only (no PWA tree).

The screen is `src/app/[locale]/admin/page.tsx` and the Operator tab. There is no `src/components/pwa` twin.

This slice does not add a chat screen. Later Tier A chat calls these use cases. It does not keep a second transcript.

## Bounded context

`src/lib/ai/` is one context. Pure modules do not import Supabase, React, or a vendor SDK.

```text
src/lib/ai/
  languageModel.ts
  conversationMemory.ts
  conversationRules.ts
  aiError.ts
  startConversation.ts
  sendTurn.ts
  listTurns.ts
  deleteConversation.ts
  listModels.ts
  saveAiProvider.ts
  bindAiService.ts
  composeAi.ts
  providers/openai/
  memory/systemLog.ts
  store/
```

| Module | Role |
|---|---|
| `languageModel.ts` | Port. Same methods for every provider. |
| `conversationMemory.ts` | Port. The system capability. |
| `conversationRules.ts` | Actor, model length, text length. No network. |
| `aiError.ts` | Stable `ai_*` codes. |
| `startConversation.ts`, `sendTurn.ts`, `listTurns.ts`, `deleteConversation.ts`, `listModels.ts` | Use cases. |
| `saveAiProvider.ts`, `bindAiService.ts` | Staff use cases. |
| `composeAi.ts` | Wires the store, the memory mode, and the adapter. |
| `providers/openai/` | OpenAI SDK, `sk-` parser, Conversations, error map. |
| `memory/systemLog.ts` | Turn log for a provider that has no thread API. |
| `store/` | Pulsar tables. The only Supabase import in this context. |

Server actions call the use cases. Components do not call a provider.

## Ports

`LanguageModel`:

- `listModelIds()`
- `send(input)` with `model`, `messages`, and an optional `providerThreadId`
- `openThread()` returns a provider thread id, or `null` when the provider has no thread API
- `eraseThread(providerThreadId)` deletes the remote thread when one exists

`ConversationMemory`:

- `begin(thread)`
- `prepareTurn(thread, text)` returns the messages to send
- `commitTurn(thread, userText, assistantText)`
- `readTurns(thread, after)`
- `erase(thread)`

A provider declares `memoryMode`: `provider_thread` or `system_log`. The thread stores that mode at start. A later binding change does not change it.

## Memory

The owner remembers the thread until an explicit delete. The use case always calls `ConversationMemory`. It does not call OpenAI Conversations.

### `provider_thread`

OpenAI fills this mode. The coincidence is that OpenAI has Conversations. The use case does not know that.

1. `openThread()` returns the vendor thread id. The row stores it. The browser never receives it.
2. `prepareTurn` returns the new user message. The first turn may also return one developer message from `instructions`.
3. `send` passes that thread id. The OpenAI adapter calls `responses.create` with `conversation` and `context_management: [{ type: "compaction", compact_threshold: 200000 }]`.
4. `commitTurn` does not copy the transcript into Postgres.
5. `readTurns` lists vendor items, one page, limit 100. It returns id, role, and text. It drops items with no role and no text.
6. `erase` lists items, deletes each item, deletes the thread, then sets `deleted_at`. A failed item delete returns `ai_delete_incomplete` and leaves `deleted_at` null.

Do not set `store: false` on this path. Do not send `previous_response_id`. Do not replay stored turns on this path.

### `system_log`

This mode covers a provider that has no thread API. Azure uses this mode until an Azure thread API is chosen. Any later provider without a thread API uses this same module.

1. `openThread()` returns `null`.
2. Postgres stores each user message and each assistant reply in `platform_ai_turns`.
3. `prepareTurn` sends the latest summary, the turns that are not folded, and the new user message.
4. If that payload is over 24000 characters, `systemLog` asks the same provider to summarize the older unfolded turns. It stores one summary row and sets `folded_at` on those turns. The owner list still returns the original text.
5. If the summary call fails, the turn fails with `ai_compaction_failed`. The use case does not send the whole history.
6. `erase` deletes the turn rows and the summary rows, then sets `deleted_at`.

Folded rows stay until delete. The summary is only for the next model call.

Text in `system_log` stays in the CentroListo database until delete. Text in `provider_thread` stays at that provider until the item delete succeeds.

## Data

New Pulsar tables. Do not drop columns added by `059_platform_openai.sql`.

`public.platform_ai_providers`

- `id uuid primary key`
- `kind text not null` check (`openai`, `azure`)
- `label text not null`
- `enabled boolean not null default true`
- `api_key_cipher text null`
- `api_key_last4 text null`
- `endpoint text null`
- `created_at timestamptz not null default now()`

`endpoint` is required for `azure` and null for `openai`. Enable RLS. No anon or authenticated policy.

`public.platform_ai_service_bindings`

- `service text primary key`
- `provider_id uuid not null references platform_ai_providers(id)`

The only service value in this slice is `conversation`.

`public.platform_ai_threads`

- `id uuid primary key`
- `service text not null`
- `host text not null`
- `owner_user_id uuid not null`
- `provider_id uuid not null`
- `memory_mode text not null` check (`provider_thread`, `system_log`)
- `model text not null`
- `provider_thread_id text null`
- `instructions text null`
- `instructions_sent boolean not null default false`
- `created_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Index active rows by `host`, `owner_user_id`, `created_at desc`. A list uses `range`, page size 50, and an exact count. Do not use `select("*")`. The public list does not return `provider_thread_id`.

`public.platform_ai_turns`

- `id uuid primary key`
- `thread_id uuid not null`
- `role text not null` check (`developer`, `user`, `assistant`, `summary`)
- `body text not null`
- `created_at timestamptz not null default now()`
- `folded_at timestamptz null`

Turns for one thread are bounded by that thread. Read them with a filter on `thread_id`. Page the owner list at 100 rows.

Cipher format is `geai:v1:<iv>:<tag>:<cipher>`, AES-256-GCM. Decrypt `geoa:v1` so a copied OpenAI cipher still opens. The secret is `AI_KEY_ENCRYPTION_SECRET` (32 raw bytes, base64). If that variable is empty, read `OPENAI_KEY_ENCRYPTION_SECRET`. Do not read `OPENAI_API_KEY`.

If `platform_settings.openai_api_key_cipher` is not null, the migration inserts one enabled `openai` provider and binds `conversation` when that binding is missing. The migration does not print the key.

## Admin behavior

Same staff gate as the operator password. Reject `mustChangePassword` with `unauthorized`.

Save a provider:

1. `kind` is `openai` or `azure`.
2. Empty key returns `ai_key_empty`.
3. The adapter parser checks the key shape. OpenAI accepts `sk-` plus letters, digits, `_`, and `-`, length 20 to 300. A bad OpenAI key returns `ai_key_invalid`.
4. `azure` returns `ai_provider_unsupported` in this slice. Do not store an Azure key yet.
5. A missing encryption secret returns `ai_encryption_unavailable`. Do not store plaintext.
6. Write cipher and last 4. Audit `platform_audit_log` with action `settings.ai_provider`. `changed_fields` names the columns. The payload has no key.
7. `revalidatePath` for `/${locale}/admin`. The client calls `router.refresh()`.

Clear and disable write audit actions `settings.ai_provider_clear` and `settings.ai_provider_enabled`. Binding writes `settings.ai_service_binding`.

List models uses the provider named by the `conversation` binding. Return at most 40 ids.

## Conversation behavior

The actor is `{ host, userId }` from the server session. Host is trimmed and lowercased, max 253. `userId` is a UUID. Do not trust that pair from the browser.

`startConversation({ actor, model, instructions? })`

- Resolve the `conversation` binding. No row returns `ai_service_unbound`. A disabled provider returns `ai_provider_disabled`.
- `model` is non-empty, max 80. `instructions` is optional, max 8000. A bad value returns `ai_input_invalid`.
- Store `memory_mode` from the provider. Success returns our thread id. It does not return a vendor thread id.

`sendTurn({ actor, threadId, text })`

- `text` is non-empty, max 32000.
- Missing or deleted row returns `ai_thread_missing`. Another owner returns `ai_thread_forbidden`.
- Call memory, then `send`, then `commitTurn`.
- Empty output returns `ai_empty_output`.
- Record `user_events` type `action`, entity `ai_thread`. Metadata is our thread id only. Analytics failure does not fail the turn.

`listTurns({ actor, threadId, after? })` uses the same owner check. One page, at most 100 items.

`deleteConversation({ actor, threadId })` uses the same owner check, then `erase`. Record `{ deleted: true }`.

Map adapter failures:

| Cause | Code |
|---|---|
| No key | `ai_key_missing` |
| Encryption secret missing | `ai_encryption_unavailable` |
| Cipher cannot be decrypted | `ai_key_corrupt` |
| Provider rejected the key | `ai_key_rejected` |
| Provider refused the call | `ai_forbidden` |
| Model is not available | `ai_model_not_found` |
| Provider rate limit | `ai_rate_limited` |
| Unmapped HTTP status | the status number, as text |
| No status | `ai_unavailable` |
| Bad input | `ai_input_invalid` |
| Empty output | `ai_empty_output` |
| Thread missing | `ai_thread_missing` |
| Wrong owner | `ai_thread_forbidden` |
| Delete stopped early | `ai_delete_incomplete` |
| Summary call failed | `ai_compaction_failed` |
| Provider disabled | `ai_provider_disabled` |
| Service has no provider | `ai_service_unbound` |
| Kind has no adapter yet | `ai_provider_unsupported` |

Log `[ge:server]` with the code and the vendor request id. Do not log the key, the prompt, or the reply. Each code has its own sentence in `en.json`, `es.json`, and `pt.json`. The sentence includes the code. An unknown code stays visible as the raw code.

## Options considered

- Call OpenAI Conversations from the use case. Rejected. A provider without that API would force a second path in product code.
- Store every transcript even when the provider already keeps the thread. Rejected. That copies student text into our database for no extra memory.
- Replay the full log when the provider has no thread API. Rejected. That is the megaprompt. The 24000 character fold is the bound.
- One platform key. Rejected. A service points at one provider. Other providers can stay saved and disabled.
- Implement the Azure HTTP client in this slice. Rejected. The kind and the `system_log` path exist. The Azure request shape is a later slice.

## Out of scope

- A chat screen.
- The Azure HTTP client.
- A key per institute.
- Automatic failover from one provider to another.
- Zero Data Retention on the OpenAI path.

## Tests

- Cipher round-trip for `geai:v1`, decrypt of a `geoa:v1` payload, wrong key, truncated payload.
- OpenAI key parser: empty, bad prefix, `sk-proj-` fixture. The fixture is not a live secret.
- Save writes ciphertext and last 4. The result and the audit omit the key.
- `system_log`: the second turn sends the summary window and the new user text. It does not require a vendor thread id. A failed summary returns `ai_compaction_failed` and does not send the unfolded history.
- `provider_thread`: the second turn sends only the new user text and the vendor thread id.
- Instructions go out once.
- Delete order for `provider_thread`. A failed item delete leaves `deleted_at` null.
- `system_log` delete removes turn rows and sets `deleted_at`.
- 401, 429, and an unmapped status. The unmapped status stays the raw code.
- A known dictionary code is not a generic sentence. An unknown code is shown raw.
- Binding an enabled provider is what `startConversation` uses. A disabled provider returns `ai_provider_disabled`.

## Manual QA (user)

- Paste an OpenAI service-account key. Reload. The field is empty and the last 4 match.
- List models.
- A client-host admin does not show this key.

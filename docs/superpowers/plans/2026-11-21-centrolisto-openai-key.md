# CentroListo OpenAI key and conversation memory

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff save one encrypted OpenAI key, and server code keeps a Conversations API thread until the owner deletes every item.

**Architecture:** The key ciphertext lives on Pulsar `platform_settings`. The encryption secret stays in `OPENAI_KEY_ENCRYPTION_SECRET`. Conversation text stays in OpenAI. Pulsar stores only the pointer. Each turn sends the new user text plus `conversation` and server-side compaction.

**Tech Stack:** Next.js server actions, official `openai` SDK, AES-256-GCM, Pulsar Postgres, Vitest.

## Global Constraints

- Cipher prefix `geoa:v1`. Do not reuse `gegw:v1`.
- Do not set `dangerouslyAllowBrowser`. Do not read `OPENAI_API_KEY`.
- Do not send `previous_response_id` or a replayed transcript.
- Compaction threshold is `200000`.
- Delete items, then the conversation, then set `deleted_at`. A failed item delete leaves `deleted_at` null.
- The browser never receives the key or `conv_…`.
- Copy in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo.
- Files stay at or under 250 lines.
- No chat screen in this slice.

---

### Task 1: Cipher, key parser, and key store

- [x] Tests for round-trip, bad key, truncated payload, key shape, save ciphertext and last 4, audit without the key.
- [x] Implement `src/lib/ai/providers/openai/openAiKeyCipher.ts`, `parseOpenAiKey.ts`, `readOpenAiEncryptionSecret.ts`, `platformOpenAiKeyStore.ts`.

### Task 2: Conversation port

- [x] Tests for pointer without `conv_…`, second turn without earlier text, instructions once, delete order, failed delete, 401, 429, and an unmapped status.
- [x] Implement the store port, the SDK port, and `platformOpenAiConversation.ts`.

### Task 3: Admin screen

- [x] Pulsar migration for the columns and `platform_openai_conversations`.
- [x] Operator form, actions, dictionaries, `.env.example`, ADR, changelog row.
- [x] UI test: empty field, last 4, model ids, error code visible.

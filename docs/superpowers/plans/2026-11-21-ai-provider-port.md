# AI provider port

**Goal:** Product code calls an AI port. OpenAI is one adapter. Conversation memory stays a system capability.

**Spec:** `docs/superpowers/specs/2026-11-21-ai-provider-port-design.md`

## Tasks

- [x] Pure cipher, rules, system-log window, and use cases with injected ports.
- [x] OpenAI adapter keeps Conversations for `provider_thread`.
- [x] Pulsar tables, provider save, and the Operator screen use `ai_*` codes.
- [x] Tests cover `system_log` fold, `provider_thread` second turn, and the dictionary code.

# AI provider port

## Context

CentroListo must call a language model. OpenAI is one provider. Azure AI is another. A later provider may have no thread API. Conversation memory must not depend on that accident.

## Decision

Product use cases call `LanguageModel` and `ConversationMemory`. OpenAI Conversations is the OpenAI adapter's `provider_thread` mode. A provider without a thread uses `system_log`: Postgres keeps the turns and folds them at 24000 characters. Each service points at one saved provider.

## Options considered

- Call OpenAI Conversations from the use case. Rejected. The next provider would need a second product path.
- Replay the full log for every provider. Rejected. That is the megaprompt, and it copies text we do not need to copy when the provider already stores the thread.

## Consequences

- A thread keeps the memory mode it started with.
- `system_log` text stays in the CentroListo database until delete.
- `provider_thread` text stays at the provider until item delete.
- Azure is a kind in the catalog. This slice does not call Azure.
- The browser still receives only the last 4 characters of a key.

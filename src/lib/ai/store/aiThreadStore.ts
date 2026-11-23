import "server-only";

import { logSupabaseError } from "@/lib/logging/serverActionLog";
import type { AiFail, AiThread, AiThreadStore } from "@/lib/ai/aiStores";
import type { MemoryMode } from "@/lib/ai/languageModel";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

const COLUMNS =
  "id, service, host, owner_user_id, provider_id, memory_mode, model, provider_thread_id, instructions, instructions_sent, deleted_at, created_at";

function fail(scope: string, error: { message: string }): AiFail {
  logSupabaseError(scope, error, {});
  return { ok: false, errorCode: "ai_unavailable" };
}

function fromRow(row: Record<string, unknown>): AiThread {
  const mode = row.memory_mode === "system_log" ? "system_log" : "provider_thread";
  return {
    id: String(row.id),
    service: String(row.service),
    host: String(row.host),
    ownerUserId: String(row.owner_user_id),
    providerId: String(row.provider_id),
    memoryMode: mode satisfies MemoryMode,
    model: String(row.model),
    providerThreadId: row.provider_thread_id == null ? null : String(row.provider_thread_id),
    instructions: row.instructions == null ? null : String(row.instructions),
    instructionsSent: Boolean(row.instructions_sent),
    deletedAt: row.deleted_at == null ? null : String(row.deleted_at),
    createdAt: String(row.created_at),
  };
}

async function updateRow(id: string, patch: Record<string, unknown>): Promise<{ ok: true } | AiFail> {
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
  const { error } = await createPulsarAdminClient().from("platform_ai_threads").update(patch).eq("id", id);
  return error ? fail("aiThreadStore:update", error) : { ok: true };
}

export function createSupabaseAiThreadStore(): AiThreadStore {
  return {
    async insert(row) {
      if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
      const { error } = await createPulsarAdminClient().from("platform_ai_threads").insert({
        id: row.id,
        service: row.service,
        host: row.host,
        owner_user_id: row.ownerUserId,
        provider_id: row.providerId,
        memory_mode: row.memoryMode,
        model: row.model,
        provider_thread_id: row.providerThreadId,
        instructions: row.instructions,
        instructions_sent: row.instructionsSent,
        deleted_at: row.deletedAt,
        created_at: row.createdAt,
      });
      return error ? fail("aiThreadStore:insert", error) : { ok: true };
    },
    async findById(id) {
      if (!isPulsarSupabaseConfigured()) return null;
      const { data, error } = await createPulsarAdminClient().from("platform_ai_threads").select(COLUMNS).eq("id", id).maybeSingle();
      if (error || !data) {
        if (error) logSupabaseError("aiThreadStore:find", error, { threadId: id });
        return null;
      }
      return fromRow(data as Record<string, unknown>);
    },
    markInstructionsSent(id) {
      return updateRow(id, { instructions_sent: true });
    },
    markDeleted(id) {
      return updateRow(id, { deleted_at: new Date().toISOString() });
    },
  };
}

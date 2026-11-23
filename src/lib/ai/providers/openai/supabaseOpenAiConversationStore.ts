import "server-only";

import { logSupabaseError } from "@/lib/logging/serverActionLog";
import type { OpenAiConversationRecord, OpenAiConversationStore } from "@/lib/ai/providers/openai/openAiConversationStore";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

const COLUMNS =
  "id, host, owner_user_id, model, openai_conversation_id, instructions, instructions_sent, deleted_at, created_at";

function fromRow(row: Record<string, unknown>): OpenAiConversationRecord {
  return {
    id: String(row.id),
    host: String(row.host),
    ownerUserId: String(row.owner_user_id),
    model: String(row.model),
    openaiConversationId: String(row.openai_conversation_id),
    instructions: row.instructions == null ? null : String(row.instructions),
    instructionsSent: Boolean(row.instructions_sent),
    deletedAt: row.deleted_at == null ? null : String(row.deleted_at),
    createdAt: String(row.created_at),
  };
}

export function createSupabaseOpenAiConversationStore(): OpenAiConversationStore {
  return {
    async insert(row) {
      if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
      const admin = createPulsarAdminClient();
      const { error } = await admin.from("platform_openai_conversations").insert({
        id: row.id,
        host: row.host,
        owner_user_id: row.ownerUserId,
        model: row.model,
        openai_conversation_id: row.openaiConversationId,
        instructions: row.instructions,
        instructions_sent: row.instructionsSent,
        deleted_at: row.deletedAt,
        created_at: row.createdAt,
      });
      if (error) {
        logSupabaseError("platformOpenAiConversation:insert", error, {});
        return { ok: false, errorCode: "openai_unavailable" };
      }
      return { ok: true };
    },
    async findById(id) {
      if (!isPulsarSupabaseConfigured()) return null;
      const admin = createPulsarAdminClient();
      const { data, error } = await admin.from("platform_openai_conversations").select(COLUMNS).eq("id", id).maybeSingle();
      if (error || !data) {
        if (error) logSupabaseError("platformOpenAiConversation:find", error, { conversationId: id });
        return null;
      }
      return fromRow(data as Record<string, unknown>);
    },
    async markInstructionsSent(id) {
      return updateRow(id, { instructions_sent: true });
    },
    async markDeleted(id) {
      return updateRow(id, { deleted_at: new Date().toISOString() });
    },
    async listActive(input) {
      if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
      const admin = createPulsarAdminClient();
      const { data, error, count } = await admin
        .from("platform_openai_conversations")
        .select("id, model, created_at", { count: "exact" })
        .eq("host", input.host)
        .eq("owner_user_id", input.ownerUserId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(input.from, input.to);
      if (error) {
        logSupabaseError("platformOpenAiConversation:list", error, {});
        return { ok: false, errorCode: "openai_unavailable" };
      }
      const rows = (data ?? []).map((row) => ({
        id: String(row.id),
        model: String(row.model),
        createdAt: String(row.created_at),
      }));
      return { ok: true, rows, total: count ?? rows.length };
    },
  };
}

async function updateRow(
  id: string,
  patch: { instructions_sent: true } | { deleted_at: string },
): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
  const admin = createPulsarAdminClient();
  const { error } = await admin.from("platform_openai_conversations").update(patch).eq("id", id);
  if (error) {
    logSupabaseError("platformOpenAiConversation:update", error, { conversationId: id });
    return { ok: false, errorCode: "openai_unavailable" };
  }
  return { ok: true };
}

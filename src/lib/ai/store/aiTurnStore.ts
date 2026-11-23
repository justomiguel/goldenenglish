import "server-only";

import { logSupabaseError } from "@/lib/logging/serverActionLog";
import type { AiFail, AiTurnStore } from "@/lib/ai/aiStores";
import type { LogTurn } from "@/lib/ai/systemLogWindow";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

const PAGE = 1000;
const CHUNK = 200;

function asRole(value: string): LogTurn["role"] | null {
  if (value === "developer" || value === "user" || value === "assistant" || value === "summary") return value;
  return null;
}

export function createSupabaseAiTurnStore(): AiTurnStore {
  return {
    async list(threadId) {
      if (!isPulsarSupabaseConfigured()) return [];
      const admin = createPulsarAdminClient();
      const rows: LogTurn[] = [];
      let from = 0;
      for (;;) {
        const { data, error } = await admin
          .from("platform_ai_turns")
          .select("id, role, body, folded_at")
          .eq("thread_id", threadId)
          .order("created_at", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) {
          logSupabaseError("aiTurnStore:list", error, { threadId });
          throw new Error("ai_unavailable");
        }
        for (const row of data ?? []) {
          const role = asRole(String(row.role));
          if (!role) continue;
          rows.push({
            id: String(row.id),
            role,
            body: String(row.body),
            foldedAt: row.folded_at == null ? null : String(row.folded_at),
          });
        }
        if ((data ?? []).length < PAGE) return rows;
        from += PAGE;
      }
    },
    async insert(threadId, turn) {
      if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
      const { error } = await createPulsarAdminClient().from("platform_ai_turns").insert({
        id: turn.id,
        thread_id: threadId,
        role: turn.role,
        body: turn.body,
        folded_at: turn.foldedAt,
      });
      if (error) {
        logSupabaseError("aiTurnStore:insert", error, { threadId });
        return { ok: false, errorCode: "ai_unavailable" };
      }
      return { ok: true };
    },
    async fold(ids, at) {
      if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
      const admin = createPulsarAdminClient();
      for (let index = 0; index < ids.length; index += CHUNK) {
        const { error } = await admin.from("platform_ai_turns").update({ folded_at: at }).in("id", ids.slice(index, index + CHUNK));
        if (error) {
          logSupabaseError("aiTurnStore:fold", error, {});
          return { ok: false, errorCode: "ai_unavailable" };
        }
      }
      return { ok: true };
    },
    async erase(threadId) {
      if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
      const admin = createPulsarAdminClient();
      for (;;) {
        const page = await admin.from("platform_ai_turns").select("id").eq("thread_id", threadId).range(0, CHUNK - 1);
        if (page.error) {
          logSupabaseError("aiTurnStore:erase", page.error, { threadId });
          return { ok: false, errorCode: "ai_delete_incomplete" } satisfies AiFail;
        }
        const ids = (page.data ?? []).map((row) => String(row.id));
        if (ids.length === 0) return { ok: true };
        const removed = await admin.from("platform_ai_turns").delete().in("id", ids);
        if (removed.error) {
          logSupabaseError("aiTurnStore:erase", removed.error, { threadId });
          return { ok: false, errorCode: "ai_delete_incomplete" };
        }
      }
    },
  };
}

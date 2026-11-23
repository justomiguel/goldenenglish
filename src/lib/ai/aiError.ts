const OPENAI_TO_AI: Record<string, string> = {
  openai_key_missing: "ai_key_missing",
  openai_encryption_unavailable: "ai_encryption_unavailable",
  openai_key_corrupt: "ai_key_corrupt",
  openai_key_rejected: "ai_key_rejected",
  openai_forbidden: "ai_forbidden",
  openai_model_not_found: "ai_model_not_found",
  openai_rate_limited: "ai_rate_limited",
  openai_unavailable: "ai_unavailable",
  openai_empty_output: "ai_empty_output",
  openai_input_invalid: "ai_input_invalid",
  openai_delete_incomplete: "ai_delete_incomplete",
};

export function mapAiCallError(err: unknown): { code: string; requestId: string | null } {
  if (err instanceof Error && err.message.startsWith("ai_")) return { code: err.message, requestId: null };
  if (err instanceof Error && OPENAI_TO_AI[err.message]) return { code: OPENAI_TO_AI[err.message] ?? "ai_unavailable", requestId: null };
  const record = err && typeof err === "object" ? (err as { status?: unknown; request_id?: unknown; requestID?: unknown }) : null;
  const status = typeof record?.status === "number" ? record.status : NaN;
  const requestId =
    typeof record?.request_id === "string" ? record.request_id : typeof record?.requestID === "string" ? record.requestID : null;
  if (status === 401) return { code: "ai_key_rejected", requestId };
  if (status === 403) return { code: "ai_forbidden", requestId };
  if (status === 404) return { code: "ai_model_not_found", requestId };
  if (status === 429) return { code: "ai_rate_limited", requestId };
  if (Number.isInteger(status) && status >= 400) return { code: String(status), requestId };
  return { code: "ai_unavailable", requestId };
}

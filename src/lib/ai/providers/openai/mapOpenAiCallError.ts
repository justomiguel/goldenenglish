export function mapOpenAiCallError(err: unknown): { code: string; requestId: string | null } {
  if (err instanceof Error && (err.message.startsWith("openai_") || err.message.startsWith("ai_"))) {
    return { code: err.message, requestId: null };
  }
  const record = err && typeof err === "object" ? (err as { status?: unknown; request_id?: unknown; requestID?: unknown }) : null;
  const status = typeof record?.status === "number" ? record.status : NaN;
  const requestId =
    typeof record?.request_id === "string"
      ? record.request_id
      : typeof record?.requestID === "string"
        ? record.requestID
        : null;
  if (status === 401) return { code: "openai_key_rejected", requestId };
  if (status === 403) return { code: "openai_forbidden", requestId };
  if (status === 404) return { code: "openai_model_not_found", requestId };
  if (status === 429) return { code: "openai_rate_limited", requestId };
  if (Number.isInteger(status) && status >= 400) return { code: String(status), requestId };
  return { code: "openai_unavailable", requestId };
}

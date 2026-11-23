const KEY_RE = /^sk-[A-Za-z0-9_-]+$/;

export function parseOpenAiKey(
  raw: string,
): { ok: true; apiKey: string; last4: string } | { ok: false; errorCode: "openai_key_empty" | "openai_key_invalid" } {
  const apiKey = raw.trim();
  if (!apiKey) return { ok: false, errorCode: "openai_key_empty" };
  if (apiKey.length < 20 || apiKey.length > 300 || !KEY_RE.test(apiKey)) {
    return { ok: false, errorCode: "openai_key_invalid" };
  }
  return { ok: true, apiKey, last4: apiKey.slice(-4) };
}

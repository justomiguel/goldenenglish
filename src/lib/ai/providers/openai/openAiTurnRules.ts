const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type OpenAiActor = { host: string; userId: string };

export function normalizeOpenAiActor(actor: OpenAiActor): OpenAiActor | null {
  const host = actor.host.trim().toLowerCase();
  const userId = actor.userId.trim();
  if (!host || host.length > 253 || !UUID_RE.test(userId)) return null;
  return { host, userId };
}

export function parseOpenAiModel(model: string): string | null {
  const value = model.trim();
  if (!value || value.length > 80) return null;
  return value;
}

export function parseOpenAiTurnText(text: string): string | null {
  const value = text.trim();
  if (!value || value.length > 32000) return null;
  return value;
}

export function parseOpenAiInstructions(instructions: string | null | undefined): string | null | "invalid" {
  if (instructions == null) return null;
  const value = instructions.trim();
  if (!value) return null;
  if (value.length > 8000) return "invalid";
  return value;
}

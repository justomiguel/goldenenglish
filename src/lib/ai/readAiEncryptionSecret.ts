export function readAiEncryptionSecret(): Buffer | null {
  const raw = (process.env.AI_KEY_ENCRYPTION_SECRET ?? process.env.OPENAI_KEY_ENCRYPTION_SECRET ?? "").trim();
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

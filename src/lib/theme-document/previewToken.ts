export type PreviewTokenPayload = { tenantSlug: string; draftId: string; exp: number };

export type PreviewTokenResult =
  | { ok: true; tenantSlug: string; draftId: string }
  | { ok: false; code: "preview_token_invalid" };

const invalid = (): PreviewTokenResult => ({ ok: false, code: "preview_token_invalid" });

export async function previewSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function previewSigningKeyFromEnv(): Promise<CryptoKey | null> {
  const secret = process.env.THEME_PREVIEW_SIGNING_KEY?.trim();
  if (!secret) return null;
  return previewSigningKey(secret);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  } catch {
    return null;
  }
}

export async function signPreviewToken(payload: PreviewTokenPayload, key: CryptoKey): Promise<string> {
  const bytes = new TextEncoder().encode(
    JSON.stringify({ tenantSlug: payload.tenantSlug, draftId: payload.draftId, exp: payload.exp }),
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, bytes));
  return `${toBase64Url(bytes)}.${toBase64Url(signature)}`;
}

export async function verifyPreviewTokenAtRequest(
  token: string,
  key: CryptoKey,
): Promise<PreviewTokenResult> {
  return verifyPreviewToken(token, key, Date.now());
}

export async function verifyPreviewToken(
  token: string,
  key: CryptoKey,
  now: number,
): Promise<PreviewTokenResult> {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return invalid();
  const body = fromBase64Url(parts[0]);
  const signature = fromBase64Url(parts[1]);
  if (!body || !signature) return invalid();
  const valid = await crypto.subtle.verify("HMAC", key, signature, body);
  if (!valid) return invalid();
  try {
    const parsed = JSON.parse(new TextDecoder().decode(body)) as Partial<PreviewTokenPayload>;
    if (typeof parsed.tenantSlug !== "string" || parsed.tenantSlug.length === 0) return invalid();
    if (typeof parsed.draftId !== "string" || parsed.draftId.length === 0) return invalid();
    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp) || parsed.exp <= now) return invalid();
    return { ok: true, tenantSlug: parsed.tenantSlug, draftId: parsed.draftId };
  } catch {
    return invalid();
  }
}

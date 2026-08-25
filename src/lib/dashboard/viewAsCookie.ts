import { createHmac, timingSafeEqual } from "node:crypto";

export const VIEW_AS_COOKIE_NAME = "ge_view_as";

export type ViewAsCookiePayload = {
  userId: string;
  iat: number;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPart(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function signingSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  return secret || null;
}

export function signViewAsCookie(userId: string, nowSeconds = Math.floor(Date.now() / 1000)): string | null {
  const secret = signingSecret();
  if (!secret || !userId.trim()) return null;
  const payload: ViewAsCookiePayload = { userId, iat: nowSeconds };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  return `${encoded}.${signPart(encoded, secret)}`;
}

export function verifyViewAsCookie(token: string | null | undefined): ViewAsCookiePayload | null {
  const secret = signingSecret();
  if (!secret || !token) return null;
  const [encoded, providedSig] = token.split(".");
  if (!encoded || !providedSig) return null;

  const expectedSig = signPart(encoded, secret);
  const provided = Buffer.from(providedSig);
  const expected = Buffer.from(expectedSig);
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as ViewAsCookiePayload;
    if (!payload.userId || typeof payload.iat !== "number") return null;
    return payload;
  } catch {
    return null;
  }
}

export const VIEW_AS_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

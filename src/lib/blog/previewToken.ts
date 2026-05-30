import { createHmac, timingSafeEqual } from "node:crypto";

interface PreviewTokenPayload {
  articleId: string;
  exp: number;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPart(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createBlogPreviewToken(articleId: string, expiresInSeconds = 86_400): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return null;
  const payload: PreviewTokenPayload = {
    articleId,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const sig = signPart(encoded, secret);
  return `${encoded}.${sig}`;
}

export function verifyBlogPreviewToken(token: string): PreviewTokenPayload | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return null;
  const [encoded, providedSig] = token.split(".");
  if (!encoded || !providedSig) return null;

  const expectedSig = signPart(encoded, secret);
  const provided = Buffer.from(providedSig);
  const expected = Buffer.from(expectedSig);
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as PreviewTokenPayload;
    if (!payload.articleId || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

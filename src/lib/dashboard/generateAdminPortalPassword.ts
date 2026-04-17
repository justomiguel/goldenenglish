const ALPHANUM = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function mapBytesToAlphanum(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += ALPHANUM[bytes[i]! % ALPHANUM.length]!;
  }
  return s;
}

/** Cryptographically random password for admin-generated credentials (browser or Node). */
export function generateAdminPortalPassword(byteLength = 24): string {
  const c = globalThis.crypto;
  if (!c?.getRandomValues) {
    throw new Error("crypto_getRandomValues_unavailable");
  }
  const u = new Uint8Array(byteLength);
  c.getRandomValues(u);
  return mapBytesToAlphanum(u);
}

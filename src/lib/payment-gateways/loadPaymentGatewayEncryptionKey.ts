import "server-only";

import { Buffer } from "node:buffer";

/** Base64-encoded 32-byte key; generate with `openssl rand -base64 32`. */
export function loadPaymentGatewayEncryptionKeyRaw32(): Buffer {
  const b64 = process.env.PAYMENT_GATEWAY_SECRET_ENCRYPTION_KEY?.trim();
  if (!b64) {
    throw new Error("missing_PAYMENT_GATEWAY_SECRET_ENCRYPTION_KEY");
  }
  const buf = Buffer.from(b64, "base64");
  if (buf.length !== 32) {
    throw new Error("PAYMENT_GATEWAY_SECRET_ENCRYPTION_KEY_must_decode_to_32_bytes");
  }
  return buf;
}

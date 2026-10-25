import "server-only";

import { Buffer } from "node:buffer";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { preferTenantValue } from "@/lib/tenant/preferTenantValue";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

/** Base64-encoded 32-byte key; generate with `openssl rand -base64 32`. */
export async function loadPaymentGatewayEncryptionKeyRaw32(
  tenantKeyOverride?: string | null,
): Promise<Buffer> {
  const tenant = getAlsTenant() ?? (await resolveRequestTenant());
  const b64 = preferTenantValue(
    tenantKeyOverride ?? tenant?.paymentGatewaySecretEncryptionKey,
    process.env.PAYMENT_GATEWAY_SECRET_ENCRYPTION_KEY,
  );
  if (!b64) {
    throw new Error("missing_PAYMENT_GATEWAY_SECRET_ENCRYPTION_KEY");
  }
  const buf = Buffer.from(b64, "base64");
  if (buf.length !== 32) {
    throw new Error("PAYMENT_GATEWAY_SECRET_ENCRYPTION_KEY_must_decode_to_32_bytes");
  }
  return buf;
}

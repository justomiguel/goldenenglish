import type { SupabaseClient } from "@supabase/supabase-js";
import type { MercadoPagoEnvironment } from "@/lib/payment-gateways/mercadopago/mercadoPagoApiBaseUrl";
import { decryptAesGcmUtf8, encryptAesGcmUtf8 } from "@/lib/payment-gateways/aesGcmPayload";
import type { PaymentGatewayCountryCode } from "@/types/paymentGateway";
import type { Buffer } from "node:buffer";

export interface MercadoPagoCredentialsPlain {
  accessToken: string;
  webhookSecret: string;
  environment: MercadoPagoEnvironment;
  enabled: boolean;
  countryCode: PaymentGatewayCountryCode;
}

export const MP_PLACEHOLDER_SECRET = "n/a";

export async function loadMercadoPagoCredentialsPlain(
  admin: SupabaseClient,
  rawKey32: Buffer,
  countryCode: PaymentGatewayCountryCode,
): Promise<MercadoPagoCredentialsPlain | null> {
  const { data, error } = await admin
    .from("payment_gateway_credentials")
    .select(
      "api_key_encrypted, webhook_secret_encrypted, environment, enabled, country_code",
    )
    .eq("provider", "mercadopago")
    .eq("country_code", countryCode)
    .maybeSingle();

  if (error || !data?.api_key_encrypted || !data?.webhook_secret_encrypted) {
    return null;
  }

  const envRaw = String(data.environment ?? "");
  const environment: MercadoPagoEnvironment =
    envRaw === "production" ? "production" : "sandbox";

  let webhookSecret: string;
  try {
    webhookSecret = decryptAesGcmUtf8(String(data.webhook_secret_encrypted), rawKey32);
    const accessToken = decryptAesGcmUtf8(String(data.api_key_encrypted), rawKey32);
    return {
      enabled: Boolean(data.enabled),
      environment,
      countryCode,
      accessToken,
      webhookSecret,
    };
  } catch {
    return null;
  }
}

/** Encrypted placeholder for NOT NULL secret_key_encrypted column (MP does not use it). */
export function mercadoPagoPlaceholderSecretCipher(rawKey32: Buffer): string {
  return encryptAesGcmUtf8(MP_PLACEHOLDER_SECRET, rawKey32);
}

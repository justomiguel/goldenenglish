"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  logServerAuthzDenied,
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { encryptAesGcmUtf8 } from "@/lib/payment-gateways/aesGcmPayload";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import {
  mercadoPagoPlaceholderSecretCipher,
} from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import type { PaymentGatewayCountryCode } from "@/types/paymentGateway";

const countrySchema = z.enum(["CL", "AR"]);

const saveSchema = z.object({
  locale: z.string().min(2).max(8),
  countryCode: countrySchema,
  environment: z.enum(["sandbox", "production"]),
  enabled: z.boolean(),
  accessToken: z.string().max(512),
  webhookSecret: z.string().max(512),
});

export type SaveMercadoPagoGatewayResult =
  | { ok: true }
  | {
      ok: false;
      error: "unauthorized" | "invalid" | "encryption" | "db" | "need_keys";
    };

export async function saveMercadoPagoGatewaySettings(
  raw: unknown,
): Promise<SaveMercadoPagoGatewayResult> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("saveMercadoPagoGatewaySettings");
    return { ok: false, error: "unauthorized" };
  }

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };

  let rawKey;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch (err) {
    logServerActionException("saveMercadoPagoGatewaySettings:encryptionKey", err);
    return { ok: false, error: "encryption" };
  }

  const country = parsed.data.countryCode;
  const supabase = await createClient();
  const tokenTrim = parsed.data.accessToken.trim();
  const webhookTrim = parsed.data.webhookSecret.trim();

  const { data: existing } = await supabase
    .from("payment_gateway_credentials")
    .select("api_key_encrypted, webhook_secret_encrypted")
    .eq("provider", "mercadopago")
    .eq("country_code", country)
    .maybeSingle();

  let apiCipher: string;
  let webhookCipher: string;

  if (existing?.api_key_encrypted && existing?.webhook_secret_encrypted) {
    apiCipher = tokenTrim
      ? encryptAesGcmUtf8(tokenTrim, rawKey)
      : String(existing.api_key_encrypted);
    webhookCipher = webhookTrim
      ? encryptAesGcmUtf8(webhookTrim, rawKey)
      : String(existing.webhook_secret_encrypted);
  } else {
    if (!tokenTrim || !webhookTrim) {
      return { ok: false, error: "need_keys" };
    }
    apiCipher = encryptAesGcmUtf8(tokenTrim, rawKey);
    webhookCipher = encryptAesGcmUtf8(webhookTrim, rawKey);
  }

  const row = {
    provider: "mercadopago" as const,
    country_code: country,
    environment: parsed.data.environment,
    enabled: parsed.data.enabled,
    api_key_encrypted: apiCipher,
    secret_key_encrypted: mercadoPagoPlaceholderSecretCipher(rawKey),
    webhook_secret_encrypted: webhookCipher,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("payment_gateway_credentials").upsert(row, {
    onConflict: "provider,country_code",
  });

  if (error) {
    logSupabaseClientError("saveMercadoPagoGatewaySettings", error, { country });
    return { ok: false, error: "db" };
  }

  await recordSystemAudit({
    action: "payment_gateway_mercadopago_upsert",
    resourceType: "payment_gateway_credentials",
    resourceId: `mercadopago_${country}`,
    payload: {
      country_code: country,
      enabled: parsed.data.enabled,
      environment: parsed.data.environment,
      access_token_rotated: Boolean(tokenTrim),
      webhook_secret_rotated: Boolean(webhookTrim),
    },
  });

  revalidatePath(`/${parsed.data.locale}/dashboard/admin/finance`, "layout");
  return { ok: true };
}

const deleteSchema = z.object({
  locale: z.string().min(2).max(8),
  countryCode: countrySchema,
});

export type DeleteMercadoPagoGatewayResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "invalid" | "db" };

export async function deleteMercadoPagoGatewayCredentials(
  raw: unknown,
): Promise<DeleteMercadoPagoGatewayResult> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("deleteMercadoPagoGatewayCredentials");
    return { ok: false, error: "unauthorized" };
  }

  const parsed = deleteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_gateway_credentials")
    .delete()
    .eq("provider", "mercadopago")
    .eq("country_code", parsed.data.countryCode);

  if (error) {
    logSupabaseClientError("deleteMercadoPagoGatewayCredentials", error, {});
    return { ok: false, error: "db" };
  }

  await recordSystemAudit({
    action: "payment_gateway_mercadopago_delete",
    resourceType: "payment_gateway_credentials",
    resourceId: `mercadopago_${parsed.data.countryCode}`,
    payload: { country_code: parsed.data.countryCode },
  });

  revalidatePath(`/${parsed.data.locale}/dashboard/admin/finance`, "layout");
  return { ok: true };
}

export type MercadoPagoAdminRowSafe = {
  countryCode: PaymentGatewayCountryCode;
  environment: "sandbox" | "production";
  enabled: boolean;
  hasCredentials: boolean;
};

export async function loadMercadoPagoGatewayAdminRows(): Promise<MercadoPagoAdminRowSafe[]> {
  try {
    await assertAdmin();
  } catch {
    return [];
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_gateway_credentials")
    .select("country_code, environment, enabled, api_key_encrypted, webhook_secret_encrypted")
    .eq("provider", "mercadopago")
    .in("country_code", ["CL", "AR"]);

  const byCountry = new Map<string, MercadoPagoAdminRowSafe>();
  for (const code of ["CL", "AR"] as const) {
    byCountry.set(code, {
      countryCode: code,
      environment: "sandbox",
      enabled: false,
      hasCredentials: false,
    });
  }

  for (const row of data ?? []) {
    const code = String(row.country_code ?? "").toUpperCase();
    if (code !== "CL" && code !== "AR") continue;
    byCountry.set(code, {
      countryCode: code,
      environment: row.environment === "production" ? "production" : "sandbox",
      enabled: Boolean(row.enabled),
      hasCredentials: Boolean(row.api_key_encrypted && row.webhook_secret_encrypted),
    });
  }

  return ["CL", "AR"].map((c) => byCountry.get(c)!);
}

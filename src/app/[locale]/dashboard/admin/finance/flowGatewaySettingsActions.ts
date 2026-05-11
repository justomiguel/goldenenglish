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

const saveSchema = z.object({
  locale: z.string().min(2).max(8),
  environment: z.enum(["sandbox", "production"]),
  enabled: z.boolean(),
  apiKey: z.string().max(512),
  secretKey: z.string().max(512),
});

export type SaveFlowChileGatewayResult =
  | { ok: true }
  | {
      ok: false;
      error: "unauthorized" | "invalid" | "encryption" | "db" | "need_keys";
    };

export async function saveFlowChileGatewaySettings(raw: unknown): Promise<SaveFlowChileGatewayResult> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("saveFlowChileGatewaySettings");
    return { ok: false, error: "unauthorized" };
  }

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };

  let rawKey;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch (err) {
    logServerActionException("saveFlowChileGatewaySettings:encryptionKey", err);
    return { ok: false, error: "encryption" };
  }

  const supabase = await createClient();
  const apiKeyTrim = parsed.data.apiKey.trim();
  const secretTrim = parsed.data.secretKey.trim();

  const { data: existing } = await supabase
    .from("payment_gateway_credentials")
    .select("api_key_encrypted, secret_key_encrypted")
    .eq("provider", "flow")
    .eq("country_code", "CL")
    .maybeSingle();

  let apiCipher: string;
  let secretCipher: string;

  if (existing?.api_key_encrypted && existing?.secret_key_encrypted) {
    if (!apiKeyTrim) {
      apiCipher = String(existing.api_key_encrypted);
    } else {
      apiCipher = encryptAesGcmUtf8(apiKeyTrim, rawKey);
    }
    if (!secretTrim) {
      secretCipher = String(existing.secret_key_encrypted);
    } else {
      secretCipher = encryptAesGcmUtf8(secretTrim, rawKey);
    }
  } else {
    if (!apiKeyTrim || !secretTrim) {
      return { ok: false, error: "need_keys" };
    }
    apiCipher = encryptAesGcmUtf8(apiKeyTrim, rawKey);
    secretCipher = encryptAesGcmUtf8(secretTrim, rawKey);
  }

  const row = {
    provider: "flow" as const,
    country_code: "CL",
    environment: parsed.data.environment,
    enabled: parsed.data.enabled,
    api_key_encrypted: apiCipher,
    secret_key_encrypted: secretCipher,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("payment_gateway_credentials").upsert(row, {
    onConflict: "provider,country_code",
  });

  if (error) {
    logSupabaseClientError("saveFlowChileGatewaySettings", error, {});
    return { ok: false, error: "db" };
  }

  await recordSystemAudit({
    action: "payment_gateway_flow_cl_upsert",
    resourceType: "payment_gateway_credentials",
    resourceId: "flow_CL",
    payload: {
      enabled: parsed.data.enabled,
      environment: parsed.data.environment,
      api_key_rotated: Boolean(apiKeyTrim),
      secret_rotated: Boolean(secretTrim),
    },
  });

  revalidatePath(`/${parsed.data.locale}/dashboard/admin/finance`, "layout");
  return { ok: true };
}

const deleteSchema = z.object({
  locale: z.string().min(2).max(8),
});

export type DeleteFlowChileGatewayResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "invalid" | "db" };

export async function deleteFlowChileGatewayCredentials(
  raw: unknown,
): Promise<DeleteFlowChileGatewayResult> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("deleteFlowChileGatewayCredentials");
    return { ok: false, error: "unauthorized" };
  }

  const parsed = deleteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_gateway_credentials")
    .delete()
    .eq("provider", "flow")
    .eq("country_code", "CL");

  if (error) {
    logSupabaseClientError("deleteFlowChileGatewayCredentials", error, {});
    return { ok: false, error: "db" };
  }

  await recordSystemAudit({
    action: "payment_gateway_flow_cl_delete",
    resourceType: "payment_gateway_credentials",
    resourceId: "flow_CL",
    payload: {},
  });

  revalidatePath(`/${parsed.data.locale}/dashboard/admin/finance`, "layout");
  return { ok: true };
}

export type FlowChileAdminRowSafe = {
  environment: "sandbox" | "production";
  enabled: boolean;
  hasCredentials: boolean;
};

export async function loadFlowChileGatewayAdminRow(): Promise<FlowChileAdminRowSafe | null> {
  try {
    await assertAdmin();
  } catch {
    return null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_gateway_credentials")
    .select("environment, enabled, api_key_encrypted, secret_key_encrypted")
    .eq("provider", "flow")
    .eq("country_code", "CL")
    .maybeSingle();

  if (!data) {
    return {
      environment: "sandbox",
      enabled: false,
      hasCredentials: false,
    };
  }
  return {
    environment: data.environment === "production" ? "production" : "sandbox",
    enabled: Boolean(data.enabled),
    hasCredentials: Boolean(data.api_key_encrypted && data.secret_key_encrypted),
  };
}

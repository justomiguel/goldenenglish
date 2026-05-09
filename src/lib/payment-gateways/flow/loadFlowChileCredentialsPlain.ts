import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlowEnvironment } from "@/lib/payment-gateways/flow/flowApiBaseUrl";
import { flowApiBaseUrl } from "@/lib/payment-gateways/flow/flowApiBaseUrl";
import { decryptAesGcmUtf8 } from "@/lib/payment-gateways/aesGcmPayload";
import type { Buffer } from "node:buffer";

export interface FlowChileCredentialsPlain {
  apiKey: string;
  secretKey: string;
  environment: FlowEnvironment;
  enabled: boolean;
}

export async function loadFlowChileCredentialsPlain(
  admin: SupabaseClient,
  rawKey32: Buffer,
): Promise<FlowChileCredentialsPlain | null> {
  const { data, error } = await admin
    .from("payment_gateway_credentials")
    .select("api_key_encrypted, secret_key_encrypted, environment, enabled")
    .eq("provider", "flow")
    .eq("country_code", "CL")
    .maybeSingle();

  if (error || !data?.api_key_encrypted || !data?.secret_key_encrypted) {
    return null;
  }

  const envRaw = String(data.environment ?? "");
  const environment: FlowEnvironment = envRaw === "production" ? "production" : "sandbox";
  return {
    enabled: Boolean(data.enabled),
    environment,
    apiKey: decryptAesGcmUtf8(String(data.api_key_encrypted), rawKey32),
    secretKey: decryptAesGcmUtf8(String(data.secret_key_encrypted), rawKey32),
  };
}

export function flowChileApiBase(creds: FlowChileCredentialsPlain): string {
  return flowApiBaseUrl(creds.environment);
}

import "server-only";

import { logServerError, logSupabaseError } from "@/lib/logging/serverActionLog";
import { decryptOpenAiKey, encryptOpenAiKey } from "@/lib/ai/providers/openai/openAiKeyCipher";
import { parseOpenAiKey } from "@/lib/ai/providers/openai/parseOpenAiKey";
import { readOpenAiEncryptionSecret } from "@/lib/ai/providers/openai/readOpenAiEncryptionSecret";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export type OpenAiKeyStatus = { saved: boolean; last4: string | null };

export async function loadPlatformOpenAiKeyStatus(): Promise<OpenAiKeyStatus> {
  if (!isPulsarSupabaseConfigured()) return { saved: false, last4: null };
  const admin = createPulsarAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("openai_api_key_cipher, openai_api_key_last4")
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) return { saved: false, last4: null };
  const cipher = String(data.openai_api_key_cipher ?? "").trim();
  const last4 = String(data.openai_api_key_last4 ?? "").trim();
  if (!cipher) return { saved: false, last4: null };
  return { saved: true, last4: last4 || null };
}

export async function loadPlatformOpenAiKeyPlain(): Promise<
  { ok: true; apiKey: string } | { ok: false; errorCode: string }
> {
  const secret = readOpenAiEncryptionSecret();
  if (!secret) return { ok: false, errorCode: "openai_encryption_unavailable" };
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
  const admin = createPulsarAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("openai_api_key_cipher")
    .eq("id", "default")
    .maybeSingle();
  if (error) {
    logSupabaseError("loadPlatformOpenAiKeyPlain", error, {});
    return { ok: false, errorCode: "openai_unavailable" };
  }
  const cipher = String(data?.openai_api_key_cipher ?? "").trim();
  if (!cipher) return { ok: false, errorCode: "openai_key_missing" };
  try {
    return { ok: true, apiKey: decryptOpenAiKey(cipher, secret) };
  } catch (err) {
    const code = err instanceof Error ? err.message : "openai_key_corrupt";
    await logServerError("loadPlatformOpenAiKeyPlain", { code });
    return { ok: false, errorCode: code === "openai_encryption_unavailable" ? code : "openai_key_corrupt" };
  }
}

export async function savePlatformOpenAiKey(input: {
  apiKey: string;
  actorUserId: string;
  actorEmail: string;
}): Promise<{ ok: true; last4: string } | { ok: false; errorCode: string }> {
  const parsed = parseOpenAiKey(input.apiKey);
  if (!parsed.ok) return parsed;
  const secret = readOpenAiEncryptionSecret();
  if (!secret) return { ok: false, errorCode: "openai_encryption_unavailable" };
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
  const cipher = encryptOpenAiKey(parsed.apiKey, secret);
  const admin = createPulsarAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .update({
      openai_api_key_cipher: cipher,
      openai_api_key_last4: parsed.last4,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");
  if (error) {
    logSupabaseError("savePlatformOpenAiKey", error, {});
    return { ok: false, errorCode: "openai_key_save_failed" };
  }
  const { error: auditError } = await admin.from("platform_audit_log").insert({
    actor_user_id: input.actorUserId,
    actor_email: input.actorEmail,
    action: "settings.openai_api_key",
    tenant_slug: "platform",
    changed_fields: ["openai_api_key_cipher", "openai_api_key_last4"],
  });
  if (auditError) logSupabaseError("savePlatformOpenAiKey:audit", auditError, {});
  return { ok: true, last4: parsed.last4 };
}

export async function clearPlatformOpenAiKey(input: {
  actorUserId: string;
  actorEmail: string;
}): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
  const admin = createPulsarAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .update({
      openai_api_key_cipher: null,
      openai_api_key_last4: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");
  if (error) {
    logSupabaseError("clearPlatformOpenAiKey", error, {});
    return { ok: false, errorCode: "openai_key_save_failed" };
  }
  const { error: auditError } = await admin.from("platform_audit_log").insert({
    actor_user_id: input.actorUserId,
    actor_email: input.actorEmail,
    action: "settings.openai_api_key_clear",
    tenant_slug: "platform",
    changed_fields: ["openai_api_key_cipher", "openai_api_key_last4"],
  });
  if (auditError) logSupabaseError("clearPlatformOpenAiKey:audit", auditError, {});
  return { ok: true };
}

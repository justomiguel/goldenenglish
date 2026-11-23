import "server-only";

import { randomUUID } from "crypto";
import { logServerError, logSupabaseError } from "@/lib/logging/serverActionLog";
import { decryptAiKey, encryptAiKey } from "@/lib/ai/aiKeyCipher";
import { readAiEncryptionSecret } from "@/lib/ai/readAiEncryptionSecret";
import type { AiProviderKind } from "@/lib/ai/languageModel";
import { parseOpenAiKey } from "@/lib/ai/providers/openai/parseOpenAiKey";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

const KEY_FIELDS = ["api_key_cipher", "api_key_last4"];

function tableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = String(error.code ?? "");
  const message = String(error.message ?? "");
  return code === "42P01" || code === "PGRST205" || message.includes("platform_ai_");
}

function keyCode(code: "openai_key_empty" | "openai_key_invalid"): "ai_key_empty" | "ai_key_invalid" {
  return code === "openai_key_empty" ? "ai_key_empty" : "ai_key_invalid";
}

async function audit(action: string, actorUserId: string, actorEmail: string): Promise<void> {
  const admin = createPulsarAdminClient();
  const { error } = await admin.from("platform_audit_log").insert({
    actor_user_id: actorUserId,
    actor_email: actorEmail,
    action,
    tenant_slug: "platform",
    changed_fields: KEY_FIELDS,
  });
  if (error) logSupabaseError("aiProviderStore:audit", error, { action });
}

export async function saveAiProvider(input: {
  kind: AiProviderKind;
  apiKey: string;
  actorUserId: string;
  actorEmail: string;
}): Promise<{ ok: true; last4: string; providerId: string } | { ok: false; errorCode: string }> {
  if (input.kind === "azure") return { ok: false, errorCode: "ai_provider_unsupported" };
  const parsed = parseOpenAiKey(input.apiKey);
  if (!parsed.ok) return { ok: false, errorCode: keyCode(parsed.errorCode) };
  const secret = readAiEncryptionSecret();
  if (!secret) return { ok: false, errorCode: "ai_encryption_unavailable" };
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
  const cipher = encryptAiKey(parsed.apiKey, secret);
  const admin = createPulsarAdminClient();
  const providerId = randomUUID();
  const { error } = await admin.from("platform_ai_providers").insert({
    id: providerId,
    kind: "openai",
    label: "OpenAI",
    enabled: true,
    api_key_cipher: cipher,
    api_key_last4: parsed.last4,
    endpoint: null,
  });
  if (error) {
    logSupabaseError("saveAiProvider", error, {});
    return { ok: false, errorCode: "ai_key_save_failed" };
  }
  const { error: bindError } = await admin.from("platform_ai_service_bindings").upsert({
    service: "conversation",
    provider_id: providerId,
  });
  if (bindError) {
    logSupabaseError("saveAiProvider:bind", bindError, {});
    return { ok: false, errorCode: "ai_key_save_failed" };
  }
  await audit("settings.ai_provider", input.actorUserId, input.actorEmail);
  return { ok: true, last4: parsed.last4, providerId };
}

export async function loadConversationProviderKey(): Promise<{ ok: true; apiKey: string } | { ok: false; errorCode: string }> {
  const secret = readAiEncryptionSecret();
  if (!secret) return { ok: false, errorCode: "ai_encryption_unavailable" };
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
  const admin = createPulsarAdminClient();
  const binding = await admin.from("platform_ai_service_bindings").select("provider_id").eq("service", "conversation").maybeSingle();
  if (binding.error) {
    logSupabaseError("loadConversationProviderKey:binding", binding.error, {});
    if (tableMissing(binding.error)) return { ok: false, errorCode: "ai_service_unbound" };
    return { ok: false, errorCode: "ai_unavailable" };
  }
  if (!binding.data?.provider_id) return { ok: false, errorCode: "ai_service_unbound" };
  const provider = await admin
    .from("platform_ai_providers")
    .select("kind, enabled, api_key_cipher")
    .eq("id", binding.data.provider_id)
    .maybeSingle();
  if (provider.error || !provider.data) {
    if (provider.error) logSupabaseError("loadConversationProviderKey:provider", provider.error, {});
    return { ok: false, errorCode: "ai_key_missing" };
  }
  if (!provider.data.enabled) return { ok: false, errorCode: "ai_provider_disabled" };
  if (provider.data.kind === "azure") return { ok: false, errorCode: "ai_provider_unsupported" };
  const cipher = String(provider.data.api_key_cipher ?? "").trim();
  if (!cipher) return { ok: false, errorCode: "ai_key_missing" };
  try {
    return { ok: true, apiKey: decryptAiKey(cipher, secret) };
  } catch (err) {
    const code = err instanceof Error && err.message.startsWith("ai_") ? err.message : "ai_key_corrupt";
    await logServerError("loadConversationProviderKey", { code });
    return { ok: false, errorCode: code };
  }
}

export async function loadAiProviderKey(providerId: string): Promise<
  { ok: true; kind: AiProviderKind; apiKey: string } | { ok: false; errorCode: string }
> {
  const secret = readAiEncryptionSecret();
  if (!secret) return { ok: false, errorCode: "ai_encryption_unavailable" };
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };
  const admin = createPulsarAdminClient();
  const provider = await admin
    .from("platform_ai_providers")
    .select("kind, enabled, api_key_cipher")
    .eq("id", providerId)
    .maybeSingle();
  if (provider.error || !provider.data) {
    if (provider.error) logSupabaseError("loadAiProviderKey", provider.error, {});
    return { ok: false, errorCode: "ai_key_missing" };
  }
  if (!provider.data.enabled) return { ok: false, errorCode: "ai_provider_disabled" };
  if (provider.data.kind !== "openai") return { ok: false, errorCode: "ai_provider_unsupported" };
  const cipher = String(provider.data.api_key_cipher ?? "").trim();
  if (!cipher) return { ok: false, errorCode: "ai_key_missing" };
  try {
    return { ok: true, kind: "openai", apiKey: decryptAiKey(cipher, secret) };
  } catch (err) {
    const code = err instanceof Error && err.message.startsWith("ai_") ? err.message : "ai_key_corrupt";
    await logServerError("loadAiProviderKey", { code });
    return { ok: false, errorCode: code };
  }
}

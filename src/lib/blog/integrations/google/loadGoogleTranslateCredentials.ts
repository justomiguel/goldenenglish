import type { SupabaseClient } from "@supabase/supabase-js";

export interface GoogleTranslateCredentials {
  apiKey: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

function parseCredentials(raw: unknown): GoogleTranslateCredentials {
  if (!raw || typeof raw !== "object") {
    return { apiKey: null, updatedAt: null, updatedBy: null };
  }
  const value = raw as Record<string, unknown>;
  return {
    apiKey: typeof value.apiKey === "string" && value.apiKey.trim() ? value.apiKey.trim() : null,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
    updatedBy: typeof value.updatedBy === "string" ? value.updatedBy : null,
  };
}

export async function loadGoogleTranslateCredentials(
  supabase: SupabaseClient,
): Promise<GoogleTranslateCredentials> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "google_translation_credentials")
    .maybeSingle();

  return parseCredentials(data?.value);
}

export function maskGoogleApiKey(apiKey: string | null): string {
  if (!apiKey) return "";
  const last4 = apiKey.slice(-4);
  return `••••••••${last4}`;
}

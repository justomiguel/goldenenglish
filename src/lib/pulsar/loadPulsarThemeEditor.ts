import "server-only";

import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { resolvePulsarSiteActor } from "@/lib/pulsar/pulsarSiteActor";
import { loadPulsarTenantBySlugForAdmin } from "@/lib/pulsar/pulsarTenantStore";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { enterTenant } from "@/lib/tenant/tenantAls";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import type { Dictionary } from "@/types/i18n";

export type PulsarThemeEditorLoad =
  | { status: "login" | "password" | "missing" }
  | {
      status: "ready";
      supabase: SupabaseClient;
      dict: Dictionary;
      themeId: string | null;
      actor: "staff" | "owner";
    };

export async function loadPulsarThemeEditor(
  locale: string,
  slug: string,
): Promise<PulsarThemeEditorLoad> {
  if (!(await isPulsarPlatformRequest())) return { status: "missing" };
  const actor = await resolvePulsarSiteActor(slug);
  if (actor.kind === "login") return { status: "login" };
  if (actor.kind !== "staff" && actor.kind !== "owner") return { status: "missing" };
  if (actor.kind === "staff" && actor.mustChangePassword) return { status: "password" };
  const tenant = await loadPulsarTenantBySlugForAdmin(slug);
  if (!tenant) return { status: "missing" };
  enterTenant(tenant);
  const supabase = await createAdminClient();
  const [{ data }, dict] = await Promise.all([
    supabase
      .from("site_themes")
      .select("id")
      .eq("is_active", true)
      .is("archived_at", null)
      .limit(1)
      .maybeSingle(),
    getDictionary(locale as AppLocale),
  ]);
  return {
    status: "ready",
    supabase,
    dict,
    themeId: typeof data?.id === "string" ? data.id : null,
    actor: actor.kind,
  };
}

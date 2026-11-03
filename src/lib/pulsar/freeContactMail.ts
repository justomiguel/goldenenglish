import "server-only";

import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { createPulsarAdminClient } from "@/lib/supabase/pulsar";

export async function reserveFreeContactMail(slug: string): Promise<string> {
  const admin = createPulsarAdminClient();
  const { data, error } = await admin.rpc("reserve_free_contact_mail", { p_slug: slug });
  if (error) {
    logSupabaseError("reserveFreeContactMail", error, { slug });
    return "missing";
  }
  return typeof data === "string" ? data : "missing";
}

export async function releaseFreeContactMail(slug: string): Promise<void> {
  const admin = createPulsarAdminClient();
  const { error } = await admin.rpc("release_free_contact_mail", { p_slug: slug });
  if (error) logSupabaseError("releaseFreeContactMail", error, { slug });
}

/** The CentroListo account email for this free site, read at send time. */
export async function loadFreeSiteOwnerEmail(slug: string): Promise<string | null> {
  const admin = createPulsarAdminClient();
  const { data: link, error } = await admin
    .from("platform_tenant_owners")
    .select("owner_user_id")
    .eq("tenant_slug", slug)
    .eq("plan", "free")
    .maybeSingle();
  if (error || !link?.owner_user_id) {
    if (error) logSupabaseError("freeSiteContact:ownerLink", error, { slug });
    return null;
  }
  const { data: owner, error: ownerErr } = await admin
    .from("platform_owners")
    .select("email")
    .eq("user_id", link.owner_user_id)
    .maybeSingle();
  if (ownerErr) {
    logSupabaseError("freeSiteContact:ownerEmail", ownerErr, { slug });
    return null;
  }
  const email = String(owner?.email ?? "").trim();
  return email.includes("@") ? email : null;
}

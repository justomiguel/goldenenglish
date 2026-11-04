import "server-only";

import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { freeSiteMessageRange } from "@/lib/pulsar/freeSiteMessagePage";
import { createPulsarAdminClient } from "@/lib/supabase/pulsar";

export type FreeSiteMessage = {
  id: string;
  tenantSlug: string;
  name: string;
  email: string;
  phone: string;
  body: string;
  createdAt: string;
};

export async function saveFreeSiteMessage(input: {
  slug: string;
  name: string;
  email: string;
  phone: string;
  body: string;
}): Promise<boolean> {
  const admin = createPulsarAdminClient();
  const { error } = await admin.from("platform_free_site_messages").insert({
    tenant_slug: input.slug,
    visitor_name: input.name,
    visitor_email: input.email,
    visitor_phone: input.phone,
    body: input.body,
  });
  if (error) {
    logSupabaseError("saveFreeSiteMessage", error, { slug: input.slug });
    return false;
  }
  return true;
}

export async function loadFreeSiteMessages(input: {
  slugs: readonly string[];
  page: number;
}): Promise<{ rows: FreeSiteMessage[]; total: number }> {
  const slugs = input.slugs.map((slug) => slug.trim()).filter(Boolean);
  if (slugs.length === 0) return { rows: [], total: 0 };
  const range = freeSiteMessageRange(input.page);
  const admin = createPulsarAdminClient();
  const { data, error, count } = await admin
    .from("platform_free_site_messages")
    .select("id, tenant_slug, visitor_name, visitor_email, visitor_phone, body, created_at", { count: "exact" })
    .in("tenant_slug", slugs)
    .order("created_at", { ascending: false })
    .range(range.from, range.to);
  if (error) {
    logSupabaseError("loadFreeSiteMessages", error, { slugCount: slugs.length });
    return { rows: [], total: 0 };
  }
  const rows = (data ?? []).map((row) => ({
    id: String(row.id),
    tenantSlug: String(row.tenant_slug),
    name: String(row.visitor_name),
    email: String(row.visitor_email),
    phone: String(row.visitor_phone ?? ""),
    body: String(row.body),
    createdAt: String(row.created_at),
  }));
  return { rows, total: count ?? rows.length };
}

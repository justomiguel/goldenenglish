import "server-only";

import { z } from "zod";
import { logServerActionException, logSupabaseError } from "@/lib/logging/serverActionLog";
import { mailOwnerRequested } from "@/lib/pulsar/pulsarOwnerMail";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

const signupSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(72),
});

export async function createPulsarOwnerAccount(input: {
  email: string;
  password: string;
  locale: string;
}): Promise<{ ok: true; userId: string } | { ok: false; errorCode: string }> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorCode: "invalid_input" };
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "not_configured" };

  const admin = createPulsarAdminClient();
  const email = parsed.data.email.toLowerCase();
  const created = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    const message = created.error?.message.toLowerCase() ?? "";
    if (message.includes("already") || message.includes("registered")) {
      return { ok: false, errorCode: "email_taken" };
    }
    logSupabaseError("createPulsarOwnerAccount:user", created.error ?? { message: "missing_user" }, {});
    return { ok: false, errorCode: "create_failed" };
  }

  const userId = created.data.user.id;
  const { error } = await admin.from("platform_owners").insert({
    user_id: userId,
    email,
    status: "pending",
  });
  if (error) {
    logSupabaseError("createPulsarOwnerAccount:row", error, { userId });
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, errorCode: "create_failed" };
  }
  await mailOwnerRequested(email, input.locale);
  return { ok: true, userId };
}

export async function loadPulsarOwnerHome(userId: string): Promise<
  | {
      kind: "owner";
      email: string;
      status: "pending" | "approved" | "rejected";
      sites: { slug: string; displayName: string; hosts: string[] }[];
      ownedCount: number;
    }
  | { kind: "missing" }
> {
  if (!isPulsarSupabaseConfigured()) return { kind: "missing" };
  try {
    const admin = createPulsarAdminClient();
    const { data: owner, error: ownerErr } = await admin
      .from("platform_owners")
      .select("email, status")
      .eq("user_id", userId)
      .maybeSingle();
    if (ownerErr || !owner) return { kind: "missing" };
    const status = owner.status === "approved" || owner.status === "rejected" ? owner.status : "pending";
    const { data: links, error: linkErr } = await admin
      .from("platform_tenant_owners")
      .select("tenant_slug")
      .eq("owner_user_id", userId)
      .limit(10);
    if (linkErr) {
      logSupabaseError("loadPulsarOwnerHome:links", linkErr, { userId });
      return { kind: "owner", email: String(owner.email), status, sites: [], ownedCount: 0 };
    }
    const slugs = (links ?? []).map((row) => String(row.tenant_slug));
    if (slugs.length === 0) {
      return { kind: "owner", email: String(owner.email), status, sites: [], ownedCount: 0 };
    }
    const { data: tenants, error: tenantErr } = await admin
      .from("platform_tenants")
      .select("slug, display_name, hosts")
      .in("slug", slugs);
    if (tenantErr) {
      logSupabaseError("loadPulsarOwnerHome:tenants", tenantErr, { userId });
    }
    const sites = (tenants ?? []).map((row) => ({
      slug: String(row.slug),
      displayName: String(row.display_name ?? row.slug),
      hosts: Array.isArray(row.hosts) ? row.hosts.map((host) => String(host)) : [],
    }));
    return { kind: "owner", email: String(owner.email), status, sites, ownedCount: slugs.length };
  } catch (err) {
    logServerActionException("loadPulsarOwnerHome", err);
    return { kind: "missing" };
  }
}

export interface PulsarOwnerRow {
  userId: string;
  email: string;
  status: "pending" | "approved" | "rejected";
}

export async function listPulsarOwners(): Promise<PulsarOwnerRow[]> {
  if (!isPulsarSupabaseConfigured()) return [];
  const admin = createPulsarAdminClient();
  const { data, error } = await admin
    .from("platform_owners")
    .select("user_id, email, status")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) {
    if (error) logSupabaseError("listPulsarOwners", error, {});
    return [];
  }
  return data.map((row) => ({
    userId: String(row.user_id),
    email: String(row.email),
    status: row.status === "approved" || row.status === "rejected" ? row.status : "pending",
  }));
}

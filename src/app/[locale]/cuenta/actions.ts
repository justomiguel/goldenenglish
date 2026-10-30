"use server";

import { revalidatePath } from "next/cache";
import { createOwnerFreeSite } from "@/lib/pulsar/createOwnerFreeSite";
import { createPulsarOwnerAccount } from "@/lib/pulsar/pulsarOwnerAccount";
import { updateOwnerSiteDomain } from "@/lib/pulsar/updateOwnerSiteDomain";
import {
  createPulsarAdminClient,
  createPulsarServerClient,
  isPulsarSupabaseConfigured,
} from "@/lib/supabase/pulsar";

async function signedOwner(): Promise<{ id: string; email: string } | null> {
  if (!isPulsarSupabaseConfigured()) return null;
  const server = await createPulsarServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) return null;
  const admin = createPulsarAdminClient();
  const { data: owner } = await admin
    .from("platform_owners")
    .select("email")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owner) return null;
  return { id: user.id, email: user.email ?? String(owner.email) };
}

export async function registerPulsarOwnerAction(input: {
  email: string;
  password: string;
  locale: string;
}): Promise<{ ok: true; userId: string } | { ok: false; errorCode: string }> {
  return createPulsarOwnerAccount(input);
}

export async function createOwnerSiteAction(input: {
  locale: string;
  displayName: string;
  slug: string;
  kind: string;
  customDomain?: string;
}): Promise<{ ok: true; slug: string } | { ok: false; errorCode: string }> {
  const owner = await signedOwner();
  if (!owner) return { ok: false, errorCode: "unauthorized" };
  const result = await createOwnerFreeSite({
    userId: owner.id,
    email: owner.email,
    displayName: input.displayName,
    slug: input.slug,
    kind: input.kind,
    locale: input.locale,
    customDomain: input.customDomain,
  });
  if (result.ok) {
    revalidatePath(`/${input.locale}/cuenta`);
    revalidatePath(`/${input.locale}`);
  }
  return result;
}

export async function updateOwnerSiteDomainAction(input: {
  locale: string;
  slug: string;
  customDomain: string;
}): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const owner = await signedOwner();
  if (!owner) return { ok: false, errorCode: "unauthorized" };
  const result = await updateOwnerSiteDomain({
    userId: owner.id,
    email: owner.email,
    slug: input.slug,
    customDomain: input.customDomain,
  });
  if (result.ok) revalidatePath(`/${input.locale}/cuenta`);
  return result;
}

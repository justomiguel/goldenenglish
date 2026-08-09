"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditIdentityAction } from "@/lib/audit";
import {
  REGISTRATION_PENDING_STATUSES,
  registrationIsActionable,
} from "@/lib/register/registrationIsActionable";

const idZ = z.string().uuid();

type StatusPatch =
  | { status: "contacted"; contacted_at: string; contacted_by: string }
  | { status: "new"; contacted_at: null; contacted_by: null };

async function applyRegistrationStatus(
  locale: string,
  registrationId: string,
  buildPatch: (actorId: string) => StatusPatch,
  scope: string,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const err = dict.actionErrors.registrationDraft;
  const regUi = dict.admin.registrations;

  let actorId = "";
  try {
    const ctx = await assertAdmin();
    actorId = ctx.user.id;
  } catch {
    logServerAuthzDenied(scope);
    return { ok: false, message: err.forbidden };
  }

  const parsed = idZ.safeParse(registrationId);
  if (!parsed.success) return { ok: false, message: err.invalidData };

  const admin = createAdminClient();

  const { data: row, error: fetchErr } = await admin
    .from("registrations")
    .select("id,status")
    .eq("id", parsed.data)
    .maybeSingle();

  if (fetchErr) {
    logSupabaseClientError(`${scope}:select`, fetchErr, { registrationId: parsed.data });
    return { ok: false, message: err.notFound };
  }
  if (!row) return { ok: false, message: err.notFound };
  if (!registrationIsActionable(row.status ?? "")) {
    return { ok: false, message: regUi.alreadyProcessed };
  }

  const patch = buildPatch(actorId);

  // Re-checking the status in the filter keeps a concurrent accept from being
  // overwritten between the read above and this write.
  const { error } = await admin
    .from("registrations")
    .update(patch)
    .eq("id", parsed.data)
    .in("status", [...REGISTRATION_PENDING_STATUSES]);

  if (error) {
    logSupabaseClientError(`${scope}:update`, error, { registrationId: parsed.data });
    return { ok: false, message: err.saveFailed };
  }

  void auditIdentityAction({
    actorId,
    actorRole: "admin",
    action: "update",
    resourceType: "registration",
    resourceId: parsed.data,
    summary: `Admin set registration follow-up status to ${patch.status}`,
    beforeValues: { status: row.status ?? null },
    afterValues: { status: patch.status },
  });

  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  return { ok: true };
}

/** Records that the institute already reached this family. */
export async function markRegistrationContacted(locale: string, registrationId: string) {
  return applyRegistrationStatus(
    locale,
    registrationId,
    (actorId) => ({
      status: "contacted",
      contacted_at: new Date().toISOString(),
      contacted_by: actorId,
    }),
    "markRegistrationContacted",
  );
}

/** Sends a lead back to the pending queue, clearing the follow-up stamp. */
export async function revertRegistrationToNew(locale: string, registrationId: string) {
  return applyRegistrationStatus(
    locale,
    registrationId,
    () => ({ status: "new", contacted_at: null, contacted_by: null }),
    "revertRegistrationToNew",
  );
}

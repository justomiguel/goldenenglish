"use server";

import { z } from "zod";
import { resolveAuthAdminInviteCreateUserIssue } from "@/lib/dashboard/resolveAuthAdminCreateUserDiagnostic";
import {
  logAuthAdminCreateUserFailure,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseInitialSiteSetupCompletedAt } from "@/lib/site/parseInitialSiteSetupRecord";
import { createIncidentSupportRef } from "@/lib/server/createIncidentSupportRef";
import { authInviteCollisionEmailMeta } from "@/lib/logging/authInviteAttemptLogMeta";

const bootstrapFirstAdminInputSchema = z
  .object({
    email: z.string().trim().email().max(200),
    password: z.string().min(8).max(72),
    passwordConfirm: z.string().min(8).max(72),
    first_name: z.string().trim().min(1).max(120),
    last_name: z.string().trim().min(1).max(120),
    dni_or_passport: z.string().trim().min(1).max(32),
    phone: z.string().trim().min(1).max(40),
  })
  .strict();

export type BootstrapFirstAdminResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "invalid_input"
        | "password_mismatch"
        | "closed"
        | "admin_already_exists"
        | "auth_failed"
        | "persist_failed";
    };

export async function bootstrapFirstAdminAction(
  raw: unknown,
): Promise<BootstrapFirstAdminResult> {
  if (process.env.SKIP_INITIAL_SITE_SETUP === "1") {
    return { ok: false, code: "closed" };
  }

  const parsed = bootstrapFirstAdminInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  if (parsed.data.password !== parsed.data.passwordConfirm) {
    return { ok: false, code: "password_mismatch" };
  }

  const admin = createAdminClient();

  const { count: adminCount, error: countErr } = await admin
    .from("profiles")
    .select("id", { head: true, count: "exact" })
    .eq("role", "admin");
  if (countErr) {
    logSupabaseClientError("bootstrapFirstAdmin:countAdmins", countErr);
    return { ok: false, code: "persist_failed" };
  }
  if ((adminCount ?? 0) > 0) return { ok: false, code: "admin_already_exists" };

  const { data: row } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "initial_site_setup")
    .maybeSingle();
  const completed = parseInitialSiteSetupCompletedAt(row?.value);
  if (completed !== null) return { ok: false, code: "closed" };

  const email = parsed.data.email.toLowerCase();
  const meta: Record<string, string> = {
    provisioning_source: "bootstrap_wizard",
    role: "admin",
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    dni_or_passport: parsed.data.dni_or_passport.trim(),
    phone: parsed.data.phone.trim(),
  };

  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: meta,
  });

  if (authErr || !created.user) {
    const classified = authErr ? resolveAuthAdminInviteCreateUserIssue(authErr) : "unexpected";
    const incidentRef = createIncidentSupportRef();
    logAuthAdminCreateUserFailure("bootstrapFirstAdmin:createUser", authErr ?? undefined, {
      classified_issue: classified,
      hadAuthUserPayload: Boolean(created?.user),
      incidentRef,
      ...(classified === "email_exists" ? authInviteCollisionEmailMeta(email) : {}),
    });
    return { ok: false, code: "auth_failed" };
  }

  const uid = created.user.id;

  const { error: auditErr } = await admin.from("system_config_audit").insert({
    actor_id: uid,
    action: "bootstrap_first_admin_created",
    resource_type: "profile",
    resource_id: uid,
    payload: { email },
  });
  if (auditErr) {
    logSupabaseClientError("bootstrapFirstAdmin:audit", auditErr);
  }

  return { ok: true };
}

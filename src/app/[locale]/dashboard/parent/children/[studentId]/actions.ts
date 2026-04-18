"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pickLocaleFromUnknownPayload } from "@/lib/parent/pickLocaleFromUnknownPayload";
import { verifyUserPassword } from "@/lib/supabase/verifyUserPassword";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { getBrandPublic } from "@/lib/brand/server";
import {
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";

const schema = z.object({
  locale: z.string().min(2).max(8),
  studentId: z.string().uuid(),
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(40),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  email: z.string().trim().email().max(254),
  /**
   * Required ONLY when the email is actually changing. Kept optional in the
   * schema so editing non-sensitive fields (name / phone / birth date) does
   * not add friction. The action enforces presence + correctness when the
   * resolved `nextEmail` differs from the ward's current email.
   */
  parentPassword: z.string().min(1).max(200).optional(),
});

export type UpdateWardProfileInput = z.infer<typeof schema>;

const SUPPORTED_LOCALES: ReadonlyArray<Locale> = ["es", "en"];
function asLocale(raw: string): Locale {
  return (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(raw)
    ? (raw as Locale)
    : "es";
}

export async function updateWardProfile(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const d = await getDictionary(pickLocaleFromUnknownPayload(raw));
    return { ok: false, message: d.dashboard.parent.wardInvalidForm };
  }

  const dict = await getDictionary(parsed.data.locale);
  const L = dict.dashboard.parent;
  const amsg = dict.actionErrors.messaging;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: amsg.unauthorized };

  const { data: me } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single();
  if (me?.role !== "parent") return { ok: false, message: L.wardForbidden };

  const { data: link } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", user.id)
    .eq("student_id", parsed.data.studentId)
    .maybeSingle();
  if (!link) return { ok: false, message: L.wardForbidden };

  const nextEmail = parsed.data.email.trim().toLowerCase();
  const admin = createAdminClient();
  const { data: authData, error: authReadErr } = await admin.auth.admin.getUserById(
    parsed.data.studentId,
  );
  if (authReadErr || !authData?.user) {
    return { ok: false, message: L.wardAuthLookupFailed };
  }
  const currentEmail = (authData.user.email ?? "").trim().toLowerCase();
  const emailChanging = nextEmail !== currentEmail;

  /**
   * Step-up re-authentication for email changes (OWASP A07).
   *
   * Editing a ward's login email is a cross-account credential change: a
   * compromised parent session can otherwise reassign the student's email
   * and trigger "forgot password" from the new mailbox to take over the
   * student account. We require the parent's CURRENT password for this one
   * branch only, so name/phone/birth-date edits stay frictionless.
   */
  if (emailChanging) {
    const parentPassword = parsed.data.parentPassword?.trim() ?? "";
    if (!parentPassword) {
      return { ok: false, message: L.wardPasswordRequired };
    }
    const parentEmail = (user.email ?? "").trim().toLowerCase();
    if (!parentEmail) {
      return { ok: false, message: L.wardPasswordInvalid };
    }
    const ok = await verifyUserPassword(parentEmail, parentPassword);
    if (!ok) return { ok: false, message: L.wardPasswordInvalid };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      phone: parsed.data.phone,
      birth_date: parsed.data.birth_date,
    })
    .eq("id", parsed.data.studentId);

  if (error) return { ok: false, message: L.wardError };

  if (emailChanging) {
    const { error: authErr } = await admin.auth.admin.updateUserById(parsed.data.studentId, {
      email: nextEmail,
      email_confirm: true,
    });
    if (authErr) {
      const m = authErr.message.toLowerCase();
      if (m.includes("already") || m.includes("registered") || m.includes("unique")) {
        return { ok: false, message: L.wardEmailTaken };
      }
      return { ok: false, message: L.wardError };
    }

    await recordEmailChangeAuditAndNotify({
      studentId: parsed.data.studentId,
      parentId: user.id,
      parentEmail: (user.email ?? "").trim().toLowerCase(),
      parentName: [me?.first_name, me?.last_name].filter(Boolean).join(" ").trim() || "—",
      wardName: [parsed.data.first_name, parsed.data.last_name].filter(Boolean).join(" ").trim() || "—",
      oldEmail: currentEmail,
      newEmail: nextEmail,
      locale: asLocale(parsed.data.locale),
    });
  }

  const loc = parsed.data.locale;
  revalidatePath(`/${loc}/dashboard/parent`);
  revalidatePath(`/${loc}/dashboard/parent/children/${parsed.data.studentId}`);
  return { ok: true };
}

/**
 * Best-effort: persists the audit row and fires the change notification to
 * BOTH old and new mailbox. Failures are logged but do NOT revert the email
 * change — at this point the new credentials are already live; the audit and
 * the notifications are detective controls, not part of the transaction.
 */
async function recordEmailChangeAuditAndNotify(input: {
  studentId: string;
  parentId: string;
  parentEmail: string;
  parentName: string;
  wardName: string;
  oldEmail: string;
  newEmail: string;
  locale: Locale;
}): Promise<void> {
  const admin = createAdminClient();

  try {
    const { error: auditErr } = await admin.from("system_config_audit").insert({
      actor_id: input.parentId,
      action: "parent.ward.email_changed",
      resource_type: "auth.user.email",
      resource_id: input.studentId,
      payload: {
        old_email: input.oldEmail,
        new_email: input.newEmail,
        parent_id: input.parentId,
        parent_email: input.parentEmail,
      },
    });
    if (auditErr) {
      logSupabaseClientError("updateWardProfile:audit_insert", auditErr, {
        studentId: input.studentId,
      });
    }
  } catch (e) {
    logServerException("updateWardProfile:audit_insert", e, {
      studentId: input.studentId,
    });
  }

  const brand = getBrandPublic();
  const supportEmail =
    (brand as { contactEmail?: string }).contactEmail?.trim() || input.parentEmail;
  const vars = {
    wardName: input.wardName,
    oldEmail: input.oldEmail,
    newEmail: input.newEmail,
    parentName: input.parentName,
    supportEmail,
  };

  for (const to of dedupe([input.oldEmail, input.newEmail].filter(Boolean))) {
    try {
      const r = await sendBrandedEmail({
        to,
        templateKey: "notifications.ward_email_changed",
        locale: input.locale,
        vars,
      });
      if (!r.ok) {
        logServerException(
          "updateWardProfile:notify",
          new Error(r.error),
          { to, studentId: input.studentId },
        );
      }
    } catch (e) {
      logServerException("updateWardProfile:notify", e, {
        to,
        studentId: input.studentId,
      });
    }
  }
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const k = v.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(v);
    }
  }
  return out;
}

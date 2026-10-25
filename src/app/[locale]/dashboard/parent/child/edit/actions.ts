"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, locales } from "@/lib/i18n/dictionaries";
import { pickLocaleFromUnknownPayload } from "@/lib/parent/pickLocaleFromUnknownPayload";
import { verifyUserPassword } from "@/lib/supabase/verifyUserPassword";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { auditIdentityAction } from "@/lib/audit";
import { recordWardEmailChange } from "@/app/[locale]/dashboard/parent/child/edit/recordWardEmailChange";
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
  /**
   * Care notes are optional on the wire: this same action serves flows that do
   * not render the care fields, and there "absent" has to mean "unchanged"
   * rather than "cleared".
   */
  care_health_note: z.string().trim().max(2000).optional(),
  care_diet_note: z.string().trim().max(2000).optional(),
  care_support_note: z.string().trim().max(2000).optional(),
});

export type UpdateWardProfileInput = z.infer<typeof schema>;

/** An emptied textarea clears the note; the column stores NULL, not "". */
function blankToNull(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

function asLocale(raw: string): Locale {
  return (locales as ReadonlyArray<string>).includes(raw) ? (raw as Locale) : "es";
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
  const admin = await createAdminClient();
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

  const careSubmitted =
    parsed.data.care_health_note !== undefined ||
    parsed.data.care_diet_note !== undefined ||
    parsed.data.care_support_note !== undefined;

  const profilePatch: Record<string, unknown> = {
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    phone: parsed.data.phone,
    birth_date: parsed.data.birth_date,
  };

  if (careSubmitted) {
    profilePatch.care_health_note = blankToNull(parsed.data.care_health_note);
    profilePatch.care_diet_note = blankToNull(parsed.data.care_diet_note);
    profilePatch.care_support_note = blankToNull(parsed.data.care_support_note);
    profilePatch.care_updated_at = new Date().toISOString();
    profilePatch.care_updated_by = user.id;
  }

  // Deliberately no `.select()` chained: migration 181 revoked SELECT on the
  // care columns for this role, so reading the row back would fail the write.
  const { error } = await supabase
    .from("profiles")
    .update(profilePatch)
    .eq("id", parsed.data.studentId);

  if (error) return { ok: false, message: L.wardError };

  if (careSubmitted) {
    // Booleans only — the audit trail records that care information changed,
    // never a word of what it says.
    void auditIdentityAction({
      actorId: user.id,
      actorRole: "parent",
      action: "update",
      resourceType: "profile",
      resourceId: parsed.data.studentId,
      summary: "Guardian updated ward care notes",
      afterValues: {
        healthPresent: profilePatch.care_health_note !== null,
        dietPresent: profilePatch.care_diet_note !== null,
        supportPresent: profilePatch.care_support_note !== null,
      },
    });
  }

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

    // Best-effort detective controls — do not block the client on notify/audit I/O.
    void recordWardEmailChange({
      studentId: parsed.data.studentId,
      parentId: user.id,
      parentEmail: (user.email ?? "").trim().toLowerCase(),
      parentName: formatProfileNameSurnameFirst(me?.first_name, me?.last_name, "—"),
      wardName: formatProfileNameSurnameFirst(parsed.data.first_name, parsed.data.last_name, "—"),
      oldEmail: currentEmail,
      newEmail: nextEmail,
      locale: asLocale(parsed.data.locale),
    });
  }

  const loc = parsed.data.locale;
  revalidatePath(`/${loc}/dashboard/parent`);
  revalidatePath(`/${loc}/dashboard/parent/child`);
  revalidatePath(`/${loc}/dashboard/parent/child/edit`);
  return { ok: true };
}

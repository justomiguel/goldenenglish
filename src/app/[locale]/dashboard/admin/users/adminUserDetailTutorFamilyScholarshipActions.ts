"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createStudentScholarship } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/upsertStudentScholarship";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { MAX_TUTOR_FAMILY_STUDENTS } from "@/lib/dashboard/loadAdminUserDetailTutorFamily";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { profileRoleEligibleAsLinkedStudentGuardian } from "@/lib/register/linkedStudentGuardianProfileRoles";
import { getDictionary, defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import {
  logServerActionException,
  logServerAuthzDenied,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";

const S = "adminUserDetailTutorFamilyScholarshipActions";

const localeZ = z.string().min(2).max(8);
const uuidZ = z.string().uuid();

const payloadZ = z.object({
  locale: localeZ,
  tutorId: uuidZ,
  sectionId: uuidZ,
  discountPercent: z.number().min(0).max(100),
  note: z.string().max(2000).optional(),
  validFromYear: z.number().int().min(2000).max(2100),
  validFromMonth: z.number().int().min(1).max(12),
  validUntilYear: z.number().int().min(2000).max(2100).nullable(),
  validUntilMonth: z.number().int().min(1).max(12).nullable(),
  isActive: z.boolean(),
});

export async function applyAdminTutorFamilyScholarshipAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = payloadZ.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
      return { ok: false, message: dict.admin.users.detailErrInvalid };
    }
    locale = locales.includes(parsed.data.locale as AppLocale)
      ? (parsed.data.locale as AppLocale)
      : defaultLocale;
    const dict = await getDictionary(locale);
    const labels = dict.admin.users;

    try {
      await assertAdmin();
    } catch {
      logServerAuthzDenied(`${S}:apply`);
      return { ok: false, message: dict.admin.users.detailErrForbidden };
    }

    const {
      tutorId,
      sectionId,
      discountPercent,
      note,
      validFromYear,
      validFromMonth,
      validUntilYear,
      validUntilMonth,
      isActive,
    } = parsed.data;

    if (validUntilYear != null && validUntilMonth != null) {
      const start = validFromYear * 12 + validFromMonth;
      const end = validUntilYear * 12 + validUntilMonth;
      if (end < start) {
        return { ok: false, message: dict.actionErrors.billingStudent.invalidDateRange };
      }
    }

    const admin = createAdminClient();
    const { data: tutorProf, error: tutorErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", tutorId)
      .maybeSingle();
    if (tutorErr) {
      logSupabaseClientError(`${S}:loadTutorRole`, tutorErr, { tutorId });
      return { ok: false, message: dict.admin.users.detailErrSave };
    }
    if (!tutorProf || !profileRoleEligibleAsLinkedStudentGuardian(tutorProf.role)) {
      return { ok: false, message: dict.admin.users.detailErrTutorNotParent };
    }

    const { data: relRows, error: relErr } = await admin
      .from("tutor_student_rel")
      .select("student_id")
      .eq("tutor_id", tutorId)
      .order("student_id", { ascending: true })
      .limit(MAX_TUTOR_FAMILY_STUDENTS);
    if (relErr) {
      logSupabaseClientError(`${S}:loadLinks`, relErr, { tutorId });
      return { ok: false, message: dict.admin.users.detailErrSave };
    }
    const studentIds = [...new Set((relRows ?? []).map((r) => String(r.student_id)))];
    if (studentIds.length === 0) {
      return { ok: false, message: labels.detailTutorFamilyScholarshipNoStudents };
    }

    const failures: string[] = [];
    let okCount = 0;
    for (const studentId of studentIds) {
      const r = await createStudentScholarship({
        locale,
        studentId,
        sectionId,
        discountPercent,
        note,
        validFromYear,
        validFromMonth,
        validUntilYear,
        validUntilMonth,
        isActive,
      });
      if (r.ok) {
        okCount += 1;
      } else {
        failures.push(`${studentId.slice(0, 8)}…: ${r.message ?? "—"}`);
      }
    }

    void recordSystemAudit({
      action: "admin_tutor_family_scholarship_apply",
      resourceType: "profiles",
      resourceId: tutorId,
      payload: {
        sectionId,
        discountPercent,
        studentAttemptCount: studentIds.length,
        successCount: okCount,
        failureCount: failures.length,
      },
    });

    revalidatePath(`/${locale}/dashboard/admin/users/${tutorId}`);

    if (failures.length === 0) {
      return {
        ok: true,
        message: labels.detailTutorFamilyScholarshipResultOk.replace("{count}", String(okCount)),
      };
    }
    if (okCount === 0) {
      return {
        ok: false,
        message: labels.detailTutorFamilyScholarshipResultNone.replace("{detail}", failures.join("; ")),
      };
    }
    return {
      ok: true,
      message: labels.detailTutorFamilyScholarshipResultPartial
        .replace("{ok}", String(okCount))
        .replace("{failed}", failures.join("; ")),
    };
  } catch (e) {
    logServerActionException(S, e, { op: "applyFamilyScholarship" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailErrSave };
  }
}

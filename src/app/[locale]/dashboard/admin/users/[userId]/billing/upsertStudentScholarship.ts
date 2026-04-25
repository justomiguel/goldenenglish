"use server";
import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { revalidateStudentBillingPaths } from "./revalidateStudentBilling";

type ScholarshipActionResult = { ok: boolean; message?: string };
type ScholarshipPayload = {
  locale: string;
  studentId: string;
  sectionId: string;
  discountPercent: number;
  note?: string;
  validFromYear: number;
  validFromMonth: number;
  validUntilYear: number | null;
  validUntilMonth: number | null;
  isActive: boolean;
};
async function validateScholarshipPayload(raw: ScholarshipPayload) {
  const dict = await getDictionary(raw.locale);
  const b = dict.actionErrors.billingStudent;
  const studentId = z.string().uuid().safeParse(raw.studentId);
  const sectionId = z.string().uuid().safeParse(raw.sectionId);
  if (!studentId.success) return { ok: false as const, message: b.invalidStudent };
  if (!sectionId.success) return { ok: false as const, message: b.invalidData };

  const parsed = z
    .object({
      discountPercent: z.number().min(0).max(100),
      note: z.string().max(2000).optional(),
      validFromYear: z.number().int().min(2000).max(2100),
      validFromMonth: z.number().int().min(1).max(12),
      validUntilYear: z.number().int().min(2000).max(2100).nullable(),
      validUntilMonth: z.number().int().min(1).max(12).nullable(),
      isActive: z.boolean(),
    })
    .safeParse(raw);
  if (!parsed.success) return { ok: false as const, message: b.invalidData };

  if (parsed.data.validUntilYear != null && parsed.data.validUntilMonth != null) {
    const start = parsed.data.validFromYear * 12 + parsed.data.validFromMonth;
    const end = parsed.data.validUntilYear * 12 + parsed.data.validUntilMonth;
    if (end < start) return { ok: false as const, message: b.invalidDateRange };
  }

  return {
    ok: true as const,
    b,
    studentId: studentId.data,
    sectionId: sectionId.data,
    data: parsed.data,
  };
}
async function loadActiveEnrollment(
  admin: Awaited<ReturnType<typeof assertAdmin>>["supabase"],
  studentId: string,
  sectionId: string,
) {
  return admin
    .from("section_enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("section_id", sectionId)
    .eq("status", "active")
    .maybeSingle();
}

export async function createStudentScholarship(
  raw: ScholarshipPayload,
): Promise<ScholarshipActionResult> {
  const validated = await validateScholarshipPayload(raw);
  if (!validated.ok) return validated;

  try {
    const { supabase: admin, user } = await assertAdmin();
    const { data: prof } = await admin
      .from("profiles")
      .select("role")
      .eq("id", validated.studentId)
      .single();
    if (prof?.role !== "student") return { ok: false, message: validated.b.notAStudent };

    const { data: enrollment, error: enrollmentError } = await loadActiveEnrollment(
      admin,
      validated.studentId,
      validated.sectionId,
    );
    if (enrollmentError || !enrollment?.id) {
      if (enrollmentError) {
        logSupabaseClientError("createStudentScholarship:loadEnrollment", enrollmentError, {
          studentId: validated.studentId,
          sectionId: validated.sectionId,
        });
      }
      return { ok: false, message: validated.b.invalidData };
    }

    const { data: created, error } = await admin
      .from("section_enrollment_scholarships")
      .insert({
        enrollment_id: enrollment.id,
        student_id: validated.studentId,
        section_id: validated.sectionId,
        discount_percent: validated.data.discountPercent,
        note: validated.data.note?.trim() || null,
        valid_from_year: validated.data.validFromYear,
        valid_from_month: validated.data.validFromMonth,
        valid_until_year: validated.data.validUntilYear,
        valid_until_month: validated.data.validUntilMonth,
        is_active: validated.data.isActive,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) {
      logSupabaseClientError("createStudentScholarship", error, {
        studentId: validated.studentId,
        sectionId: validated.sectionId,
      });
      return { ok: false, message: validated.b.saveFailed };
    }

    const scholarshipId = (created as { id: string }).id;
    void recordSystemAudit({
      action: "student_section_scholarship_created",
      resourceType: "section_enrollment_scholarship",
      resourceId: scholarshipId,
      payload: {
        actorId: user.id,
        studentId: validated.studentId,
        sectionId: validated.sectionId,
        discountPercent: validated.data.discountPercent,
      },
    });
    revalidateStudentBillingPaths(raw.locale, validated.studentId);
    return { ok: true };
  } catch (err) {
    logServerException("createStudentScholarship", err);
    return { ok: false, message: validated.b.forbidden };
  }
}

export async function updateStudentScholarship(
  raw: ScholarshipPayload & { scholarshipId: string },
): Promise<ScholarshipActionResult> {
  const validated = await validateScholarshipPayload(raw);
  if (!validated.ok) return validated;
  const scholarshipId = z.string().uuid().safeParse(raw.scholarshipId);
  if (!scholarshipId.success) return { ok: false, message: validated.b.invalidData };

  try {
    const { supabase: admin, user } = await assertAdmin();
    const { data: updated, error } = await admin
      .from("section_enrollment_scholarships")
      .update({
        discount_percent: validated.data.discountPercent,
        note: validated.data.note?.trim() || null,
        valid_from_year: validated.data.validFromYear,
        valid_from_month: validated.data.validFromMonth,
        valid_until_year: validated.data.validUntilYear,
        valid_until_month: validated.data.validUntilMonth,
        is_active: validated.data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scholarshipId.data)
      .eq("student_id", validated.studentId)
      .eq("section_id", validated.sectionId)
      .select("id");
    if (error) {
      logSupabaseClientError("updateStudentScholarship", error, {
        scholarshipId: scholarshipId.data,
      });
      return { ok: false, message: validated.b.saveFailed };
    }
    if (!updated || updated.length === 0) return { ok: false, message: validated.b.invalidData };

    void recordSystemAudit({
      action: "student_section_scholarship_updated",
      resourceType: "section_enrollment_scholarship",
      resourceId: scholarshipId.data,
      payload: {
        actorId: user.id,
        studentId: validated.studentId,
        sectionId: validated.sectionId,
        discountPercent: validated.data.discountPercent,
      },
    });
    revalidateStudentBillingPaths(raw.locale, validated.studentId);
    return { ok: true };
  } catch (err) {
    logServerException("updateStudentScholarship", err);
    return { ok: false, message: validated.b.forbidden };
  }
}

export async function deactivateStudentScholarship(raw: {
  locale: string;
  studentId: string;
  sectionId: string;
  scholarshipId: string;
}): Promise<ScholarshipActionResult> {
  const dict = await getDictionary(raw.locale);
  const b = dict.actionErrors.billingStudent;
  const studentId = z.string().uuid().safeParse(raw.studentId);
  const sectionId = z.string().uuid().safeParse(raw.sectionId);
  const scholarshipId = z.string().uuid().safeParse(raw.scholarshipId);
  if (!studentId.success || !sectionId.success || !scholarshipId.success) {
    return { ok: false, message: b.invalidData };
  }

  try {
    const { supabase: admin, user } = await assertAdmin();
    const { data: updated, error } = await admin
      .from("section_enrollment_scholarships")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", scholarshipId.data)
      .eq("student_id", studentId.data)
      .eq("section_id", sectionId.data)
      .select("id");
    if (error) {
      logSupabaseClientError("deactivateStudentScholarship", error, {
        scholarshipId: scholarshipId.data,
      });
      return { ok: false, message: b.saveFailed };
    }
    if (!updated || updated.length === 0) return { ok: false, message: b.invalidData };

    void recordSystemAudit({
      action: "student_section_scholarship_deactivated",
      resourceType: "section_enrollment_scholarship",
      resourceId: scholarshipId.data,
      payload: {
        actorId: user.id,
        studentId: studentId.data,
        sectionId: sectionId.data,
      },
    });
    revalidateStudentBillingPaths(raw.locale, studentId.data);
    return { ok: true };
  } catch (err) {
    logServerException("deactivateStudentScholarship", err);
    return { ok: false, message: b.forbidden };
  }
}

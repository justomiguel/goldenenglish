import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompleteInitialSiteSetupInput } from "@/lib/site/siteSetupCompletionSchema";
import { logSupabaseError } from "@/lib/logging/serverActionLog";

type Json = unknown;

interface UpsertRow {
  key: string;
  value: Json;
}

function pickInt(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function pickStr(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Builds the `site_settings` rows that the wizard wants to persist for the
 * operational categories. Returns an empty array when nothing operational was
 * sent (both greenfield and edit modes can call this safely; a tenant that
 * already had values keeps them untouched if the wizard didn't send any).
 */
export function buildSiteSetupOperationalRows(
  data: CompleteInitialSiteSetupInput,
): UpsertRow[] {
  const rows: UpsertRow[] = [];

  const legalAge = pickInt(data.legalAgeMajority);
  if (legalAge !== null) rows.push({ key: "legal_age_majority", value: { value: legalAge } });

  const renewal = pickInt(data.studentRenewalWarnDays);
  if (renewal !== null) {
    rows.push({ key: "student_renewal_warn_days", value: { value: renewal } });
  }

  const billing = {
    enrollment: {
      es: pickStr(data.billingTermEnrollment),
      en: pickStr(data.billingTermEnrollmentEn),
    },
    monthly: {
      es: pickStr(data.billingTermMonthly),
      en: pickStr(data.billingTermMonthlyEn),
    },
    promotion: {
      es: pickStr(data.billingTermPromotion),
      en: pickStr(data.billingTermPromotionEn),
    },
  };
  const billingHasAny =
    billing.enrollment.es ||
    billing.enrollment.en ||
    billing.monthly.es ||
    billing.monthly.en ||
    billing.promotion.es ||
    billing.promotion.en;
  if (billingHasAny) rows.push({ key: "billing_terms", value: billing });

  const sectionMax = pickInt(data.academicsSectionMaxStudents);
  const roles = pickStr(data.academicsTeacherPortalRoles);
  if (sectionMax !== null || roles) {
    rows.push({
      key: "academics_section_defaults",
      value: {
        ...(sectionMax !== null ? { maxStudents: sectionMax } : {}),
        ...(roles
          ? {
              teacherPortalRoles: roles
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : {}),
      },
    });
  }

  const matrix = {
    teacher: {
      scanLookbackBufferDays: pickInt(
        data.attendanceTeacherScanLookbackBufferDays,
      ),
      operationalCivilLookbackDays: pickInt(
        data.attendanceTeacherOperationalCivilLookbackDays,
      ),
      operationalMaxClassDays: pickInt(
        data.attendanceTeacherOperationalMaxClassDays,
      ),
      fullCourseMaxClassDays: pickInt(
        data.attendanceTeacherFullCourseMaxClassDays,
      ),
    },
    admin: {
      fallbackLookbackDays: pickInt(data.attendanceAdminFallbackLookbackDays),
      maxClassDays: pickInt(data.attendanceAdminMaxClassDays),
    },
    pickAdjacentCivilDays: pickInt(data.attendancePickAdjacentCivilDays),
    hasEligibleWindowMaxScans: pickInt(
      data.attendanceHasEligibleWindowMaxScans,
    ),
  };
  const matrixHasAny =
    Object.values(matrix.teacher).some((v) => v !== null) ||
    Object.values(matrix.admin).some((v) => v !== null) ||
    matrix.pickAdjacentCivilDays !== null ||
    matrix.hasEligibleWindowMaxScans !== null;
  if (matrixHasAny) {
    rows.push({ key: "academics_attendance_matrix", value: matrix });
  }

  const analytics = {
    namespace: pickStr(data.analyticsEventNamespace),
    version: pickStr(data.analyticsEventVersion),
    timezone: pickStr(data.analyticsTimezone),
  };
  if (analytics.namespace || analytics.version || analytics.timezone) {
    rows.push({ key: "analytics_config", value: analytics });
  }

  return rows;
}

export async function persistSiteSetupOperationalSettings(
  supabase: SupabaseClient,
  rows: UpsertRow[],
): Promise<{ ok: true } | { ok: false }> {
  if (rows.length === 0) return { ok: true };
  const { error } = await supabase
    .from("site_settings")
    .upsert(rows, { onConflict: "key" });
  if (error) {
    logSupabaseError("siteSetup:operationalSettings", error);
    return { ok: false };
  }
  return { ok: true };
}

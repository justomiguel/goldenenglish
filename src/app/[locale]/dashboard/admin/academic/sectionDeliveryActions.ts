"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { persistSectionDailyRooms } from "@/lib/academics/syncSectionDailyRooms";
import { tenantDailyCredentials } from "@/lib/academics/sectionDailyTenant";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  logServerActionException,
  logServerAuthzDenied,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { parseCommercialPlan } from "@/lib/pulsar/commercialPlan";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

const uuid = z.string().uuid();
const ModeSchema = z.enum(["in_person", "hybrid", "remote"]);

export type SaveAcademicSectionDeliveryModeResult =
  | { ok: true; failedSlots: { dayOfWeek: number; startTime: string }[] }
  | { ok: false; code: "forbidden" | "invalid" | "not_ecosistema" };

function deny(error: unknown): SaveAcademicSectionDeliveryModeResult {
  if (
    error instanceof Error &&
    (error.message === ADMIN_SESSION_UNAUTHORIZED || error.message === ADMIN_SESSION_FORBIDDEN)
  ) {
    logServerAuthzDenied("sectionDaily.saveMode", { reason: error.message });
    return { ok: false, code: "forbidden" };
  }
  logServerActionException("sectionDaily.saveMode", error);
  return { ok: false, code: "invalid" };
}

export async function saveAcademicSectionDeliveryModeAction(input: {
  locale: string;
  sectionId: string;
  mode: "in_person" | "hybrid" | "remote";
}): Promise<SaveAcademicSectionDeliveryModeResult> {
  let supabase;
  try {
    ({ supabase } = await assertAdmin());
  } catch (error) {
    return deny(error);
  }

  const sectionId = uuid.safeParse(input.sectionId.trim());
  const mode = ModeSchema.safeParse(input.mode);
  if (!sectionId.success || !mode.success) return { ok: false, code: "invalid" };

  const tenant = await resolveRequestTenant();
  if (parseCommercialPlan(tenant?.commercialPlan) !== "ecosistema") {
    return { ok: false, code: "not_ecosistema" };
  }

  try {
    const { data: row, error } = await supabase
      .from("academic_sections")
      .update({ delivery_mode: mode.data })
      .eq("id", sectionId.data)
      .select("id, cohort_id")
      .maybeSingle();

    const section = row as { id: string; cohort_id: string } | null;
    if (error || !section?.id || !section.cohort_id) {
      if (error) {
        logSupabaseClientError("sectionDaily.saveMode", error, { sectionId: sectionId.data });
      }
      return { ok: false, code: "invalid" };
    }

    const persistResult = await persistSectionDailyRooms({
      supabase: await createAdminClient(),
      sectionId: sectionId.data,
      mode: mode.data,
      credentials: tenantDailyCredentials(tenant),
    });
    if (!persistResult.ok) {
      logSupabaseClientError("sectionDaily.saveMode", persistResult.error, {
        sectionId: sectionId.data,
      });
      return { ok: false, code: "invalid" };
    }

    void recordSystemAudit({
      action: "section_delivery_mode_saved",
      resourceType: "academic_section",
      resourceId: sectionId.data,
      payload: { deliveryMode: mode.data },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(
      `/${input.locale}/dashboard/admin/academic/${section.cohort_id}/${section.id}`,
      "page",
    );
    revalidatePath(`/${input.locale}/dashboard/student`);
    revalidatePath(`/${input.locale}/dashboard/teacher`);
    return { ok: true, failedSlots: persistResult.failedSlots };
  } catch (error) {
    return deny(error);
  }
}

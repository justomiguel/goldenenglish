import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { findCohortForCalendarYear } from "@/lib/admin-tutorials/findCohortForCalendarYear";
import { resolveTargetCohortForSectionTour } from "@/lib/admin-tutorials/resolveTargetCohortForSectionTour";
import {
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

/**
 * First section under the target cohort that has at least one schedule slot —
 * used by the take-attendance guided tour.
 */
export async function GET() {
  try {
    const { supabase } = await assertAdmin();
    const year = new Date().getFullYear();

    const { data: cohorts, error: cErr } = await supabase
      .from("academic_cohorts")
      .select("id, name, slug, starts_on, ends_on, archived_at, is_current")
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (cErr) {
      logSupabaseClientError("api/admin/tutorials/attendance-target:cohorts", cErr);
      return NextResponse.json({ error: "load_failed" }, { status: 500 });
    }

    const target =
      resolveTargetCohortForSectionTour(cohorts ?? [], year) ??
      findCohortForCalendarYear(cohorts ?? [], year);
    if (!target) {
      return NextResponse.json(
        { cohortId: null, sectionId: null },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const { data: sections, error: sErr } = await supabase
      .from("academic_sections")
      .select("id, schedule_slots")
      .eq("cohort_id", target.id)
      .is("archived_at", null)
      .order("created_at", { ascending: true })
      .limit(40);

    if (sErr) {
      logSupabaseClientError("api/admin/tutorials/attendance-target:sections", sErr);
      return NextResponse.json({ error: "load_failed" }, { status: 500 });
    }

    const withSchedule = (sections ?? []).find((row) => {
      const slots = row.schedule_slots;
      return Array.isArray(slots) && slots.length > 0;
    });

    return NextResponse.json(
      {
        cohortId: target.id,
        sectionId: withSchedule?.id ?? sections?.[0]?.id ?? null,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    logServerException("api/admin/tutorials/attendance-target", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

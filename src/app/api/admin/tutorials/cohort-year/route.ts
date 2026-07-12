import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { findCohortForCalendarYear } from "@/lib/admin-tutorials/findCohortForCalendarYear";
import { resolveTargetCohortForSectionTour } from "@/lib/admin-tutorials/resolveTargetCohortForSectionTour";
import { logServerException } from "@/lib/logging/serverActionLog";

export async function GET() {
  try {
    const { supabase } = await assertAdmin();
    const year = new Date().getFullYear();

    const { data, error } = await supabase
      .from("academic_cohorts")
      .select("id, name, slug, starts_on, ends_on, archived_at, is_current")
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      logServerException("api/admin/tutorials/cohort-year", error, { year });
      return NextResponse.json({ error: "load_failed" }, { status: 500 });
    }

    const existing = findCohortForCalendarYear(data ?? [], year);
    const target = resolveTargetCohortForSectionTour(data ?? [], year);

    return NextResponse.json(
      {
        year,
        existing: existing ? { id: existing.id, name: existing.name } : null,
        targetCohort: target ? { id: target.id, name: target.name } : null,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (e) {
    logServerException("api/admin/tutorials/cohort-year", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

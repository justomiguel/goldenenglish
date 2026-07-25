import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

/**
 * First active student enrollment for scholarship tours (billing page target).
 */
export async function GET() {
  try {
    const { supabase } = await assertAdmin();

    const { data, error } = await supabase
      .from("section_enrollments")
      .select("student_id")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logSupabaseClientError("api/admin/tutorials/scholarship-target", error);
      return NextResponse.json({ error: "load_failed" }, { status: 500 });
    }

    return NextResponse.json(
      { studentId: data?.student_id ?? null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    logServerException("api/admin/tutorials/scholarship-target", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

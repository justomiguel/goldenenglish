import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

/** First institute event for event-payment tours (detail → payments tab). */
export async function GET() {
  try {
    const { supabase } = await assertAdmin();

    const { data, error } = await supabase
      .from("events")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logSupabaseClientError("api/admin/tutorials/event-target", error);
      return NextResponse.json({ error: "load_failed" }, { status: 500 });
    }

    return NextResponse.json(
      { eventId: data?.id ?? null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    logServerException("api/admin/tutorials/event-target", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createEventUploadSignedUrl } from "@/lib/events/server/uploadEventAttendeeFileServer";
import { logServerException } from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          attendeeId?: string;
          fieldId?: string;
          fileName?: string;
          mimeType?: string;
        }
      | null;
    if (!body?.attendeeId || !body.fieldId || !body.fileName || !body.mimeType) {
      return NextResponse.json({ ok: false, code: "invalid_body" }, { status: 400 });
    }

    const { slug } = await context.params;
    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: attendee } = await admin
      .from("event_attendees")
      .select("id, user_id, event_id, events!inner(slug)")
      .eq("id", body.attendeeId)
      .maybeSingle();

    if (!attendee || (attendee.events as { slug?: string })?.slug !== slug) {
      return NextResponse.json({ ok: false, code: "attendee_not_found" }, { status: 404 });
    }
    if ((attendee.user_id as string | null) !== user.id) {
      return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
    }

    const signed = await createEventUploadSignedUrl({
      eventId: String(attendee.event_id),
      attendeeId: body.attendeeId,
      fieldId: body.fieldId,
      fileName: body.fileName,
      mimeType: body.mimeType,
    });
    if (!signed) {
      return NextResponse.json({ ok: false, code: "sign_failed" }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        path: signed.path,
        token: signed.token,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    logServerException("api/events/file-signed-url", error);
    return NextResponse.json(
      { ok: false, code: "server_error" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}

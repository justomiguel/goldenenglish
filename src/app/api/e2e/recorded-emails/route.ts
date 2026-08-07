import { NextResponse } from "next/server";
import {
  clearRecordedEmails,
  getRecordedEmails,
} from "@/lib/email/recordingEmailProvider";
import { shouldUseRecordingEmailProvider } from "@/lib/email/shouldUseRecordingEmailProvider";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

function denyUnlessRecordingMode(): NextResponse | null {
  if (!shouldUseRecordingEmailProvider()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return null;
}

/** E2E introspection only — RecordingEmailProvider in-memory log. */
export async function GET() {
  const denied = denyUnlessRecordingMode();
  if (denied) return denied;
  return NextResponse.json(
    { ok: true as const, emails: getRecordedEmails() },
    { headers: NO_STORE },
  );
}

export async function DELETE() {
  const denied = denyUnlessRecordingMode();
  if (denied) return denied;
  clearRecordedEmails();
  return NextResponse.json({ ok: true as const }, { headers: NO_STORE });
}

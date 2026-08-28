import { NextResponse } from "next/server";
import { prepareBlogMediaFileUpload } from "@/lib/blog/server/prepareBlogMediaFileUpload";
import { assertBlogAuthor } from "@/lib/dashboard/assertBlogAuthor";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  try {
    const { supabase, user } = await assertBlogAuthor();
    const raw = await request.json().catch(() => null);
    const result = await prepareBlogMediaFileUpload(supabase, user.id, raw);
    if (!result.ok) {
      const status =
        result.code === "invalid_input" ? 400 : result.code === "forbidden" ? 403 : 500;
      return NextResponse.json(result, { status, headers: noStore });
    }
    return NextResponse.json(result, { headers: noStore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === ADMIN_SESSION_UNAUTHORIZED || message === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("POST /api/blog/media-signed-upload");
      return NextResponse.json({ ok: false, code: "forbidden" }, { status: 401, headers: noStore });
    }
    return NextResponse.json({ ok: false, code: "persist_failed" }, { status: 500, headers: noStore });
  }
}

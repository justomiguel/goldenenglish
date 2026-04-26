import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerException } from "@/lib/logging/serverActionLog";
import { LEARNING_TASK_ASSET_BUCKET } from "@/lib/learning-tasks";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path?.trim()) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const { supabase } = await assertAdmin();
    const { data, error } = await supabase.storage
      .from(LEARNING_TASK_ASSET_BUCKET)
      .createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.redirect(data.signedUrl, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    logServerException("contentAssetRedirect", err);
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
}

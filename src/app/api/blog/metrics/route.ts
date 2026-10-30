import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const bodySchema = z.object({
  kind: z.enum(["list_view", "article_view", "cta_click"]),
  articleId: z.string().uuid().nullable(),
  source: z.enum(["index", "other"]).nullable(),
  locale: z.enum(["en", "es", "pt"]),
});

const COOKIE = "ge_blog_vid";

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  }

  const cookieStore = await cookies();
  let visitor = cookieStore.get(COOKIE)?.value ?? "";
  const isNew = visitor.length === 0;
  if (isNew) visitor = randomUUID();

  const { kind, articleId, source } = parsed.data;
  const dedupe = createHash("sha256")
    .update(`${kind}|${articleId ?? ""}|${source ?? ""}|${utcDay()}|${visitor}`)
    .digest("hex");

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("record_blog_metric", {
      p_kind: kind,
      p_article_id: articleId,
      p_source: source,
      p_dedupe_key: dedupe,
    });
    if (error) {
      logSupabaseClientError("blog.metrics", error);
    }
  } catch (error) {
    logServerException("blog.metrics", error);
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  if (isNew) {
    response.cookies.set(COOKIE, visitor, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 400 * 24 * 60 * 60,
    });
  }
  return response;
}

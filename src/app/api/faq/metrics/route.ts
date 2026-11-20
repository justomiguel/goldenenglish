import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { isMozarthitosFaqQuestionId } from "@/variants/owned/mozarthitos/pieces/faqQuestionIds";

const bodySchema = z
  .object({
    kind: z.enum(["visit", "open"]),
    questionId: z.string().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "visit" && value.questionId !== null) {
      ctx.addIssue({ code: "custom", message: "visit" });
    }
    if (
      value.kind === "open" &&
      (value.questionId === null || !isMozarthitosFaqQuestionId(value.questionId))
    ) {
      ctx.addIssue({ code: "custom", message: "open" });
    }
  });

const COOKIE = "ge_faq_vid";

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

  const { kind, questionId } = parsed.data;
  const dedupe = createHash("sha256")
    .update(`${kind}|${questionId ?? ""}|${utcDay()}|${visitor}`)
    .digest("hex");

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("record_faq_metric", {
      p_kind: kind,
      p_question_id: questionId,
      p_dedupe_key: dedupe,
    });
    if (error) {
      logSupabaseClientError("faq.metrics", error, { code: "record_failed" });
    }
  } catch (error) {
    logServerException("faq.metrics", error, { code: "record_failed" });
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

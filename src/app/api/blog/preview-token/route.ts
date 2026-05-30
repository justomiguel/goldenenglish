import { NextResponse } from "next/server";
import { z } from "zod";
import { assertBlogAuthor } from "@/lib/dashboard/assertBlogAuthor";
import { createBlogPreviewToken } from "@/lib/blog/previewToken";

const bodySchema = z.object({
  articleId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    await assertBlogAuthor();
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const token = createBlogPreviewToken(parsed.data.articleId);
  if (!token) return NextResponse.json({ ok: false }, { status: 500 });

  return NextResponse.json(
    { ok: true, token },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

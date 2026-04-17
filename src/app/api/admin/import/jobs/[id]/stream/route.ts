import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { readImportJob } from "@/lib/import/importJobKv";
import { logServerAuthzDenied, logServerException } from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";
/** Aligned with ~720 ticks × 500 ms of the stream’s internal polling window. */
export const maxDuration = 360;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new Response("invalid_id", { status: 400 });
  }

  let userId: string;
  try {
    const { user } = await assertAdmin();
    userId = user.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === ADMIN_SESSION_UNAUTHORIZED) {
      return new Response("unauthorized", { status: 401 });
    }
    if (msg === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("api/admin/import/jobs/[id]/stream:GET");
      return new Response("forbidden", { status: 403 });
    }
    logServerException("api/admin/import/jobs/[id]/stream:GET:assertAdmin", e);
    return new Response("forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastPayload = "";
      const maxTicks = 720;
      for (let i = 0; i < maxTicks; i++) {
        const job = await readImportJob(id);
        if (!job) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ status: "error", error: "not_found", message: "not_found" })}\n\n`,
            ),
          );
          controller.close();
          return;
        }
        if (job.ownerId !== userId) {
          controller.error(new Error("forbidden"));
          return;
        }
        const payload = JSON.stringify(job);
        if (payload !== lastPayload) {
          lastPayload = payload;
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        }
        if (job.status === "done" || job.status === "error") {
          controller.close();
          return;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

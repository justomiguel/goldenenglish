import { readBackupJob } from "@/lib/pulsar/backup/backupJobStore";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { createPulsarServerClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = { params: Promise<{ id: string }> };

async function readerId(): Promise<string | null> {
  if (!isPulsarSupabaseConfigured()) {
    const session = await getPulsarStaffSession();
    return session?.userId ?? null;
  }
  const client = await createPulsarServerClient();
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("job_not_found", { status: 400 });
  const userId = await readerId();
  if (!userId) {
    logServerAuthzDenied("pulsar.backup.job.stream");
    return new Response("unauthorized", { status: 401 });
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (let tick = 0; tick < 600; tick += 1) {
        const job = await readBackupJob(id);
        if (!job || job.ownerId !== userId) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "error", error: "job_not_found" })}\n\n`));
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(job)}\n\n`));
        if (job.status === "done" || job.status === "error") {
          controller.close();
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "private, no-store",
      Connection: "keep-alive",
    },
  });
}

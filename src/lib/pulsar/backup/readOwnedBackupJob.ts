import { NextResponse } from "next/server";
import { readBackupJob } from "@/lib/pulsar/backup/backupJobStore";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { createPulsarServerClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export const dynamic = "force-dynamic";

const PRIVATE = { "Cache-Control": "private, no-store" };

async function readerId(): Promise<string | null> {
  if (!isPulsarSupabaseConfigured()) {
    const session = await getPulsarStaffSession();
    return session?.userId ?? null;
  }
  const client = await createPulsarServerClient();
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

export async function readOwnedBackupJob(id: string): Promise<Response> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ status: "error", error: "job_not_found" }, { status: 400, headers: PRIVATE });
  }
  const userId = await readerId();
  if (!userId) {
    logServerAuthzDenied("pulsar.backup.job");
    return NextResponse.json({ status: "error", error: "unauthorized" }, { status: 401, headers: PRIVATE });
  }
  const job = await readBackupJob(id);
  if (!job) {
    return NextResponse.json({ status: "error", error: "job_not_found" }, { status: 404, headers: PRIVATE });
  }
  if (job.ownerId !== userId) {
    logServerAuthzDenied("pulsar.backup.job");
    return NextResponse.json({ status: "error", error: "unauthorized" }, { status: 403, headers: PRIVATE });
  }
  return NextResponse.json(job, { headers: PRIVATE });
}

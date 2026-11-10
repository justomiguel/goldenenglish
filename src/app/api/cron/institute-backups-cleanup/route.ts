import { NextResponse } from "next/server";
import { INSTITUTE_BACKUPS_BUCKET } from "@/lib/pulsar/backup/backupJobStore";
import { staleBackupNames } from "@/lib/pulsar/backup/staleBackupNames";
import { verifyCronRequest } from "@/lib/auth/verifyCronRequest";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!isPulsarSupabaseConfigured()) {
    return NextResponse.json({ ok: true, removed: 0 });
  }
  try {
    const admin = createPulsarAdminClient();
    let removed = 0;
    const bucket = admin.storage.from(INSTITUTE_BACKUPS_BUCKET);
    const sweep = async (prefix: string) => {
      const listed = await bucket.list(prefix, { limit: 100 });
      if (listed.error) {
        logSupabaseClientError("pulsar.backup.cleanup", listed.error, { prefix });
        return;
      }
      const names = staleBackupNames(
        (listed.data ?? []).map((item) => ({
          name: item.name,
          createdAt: item.created_at ?? item.updated_at ?? null,
        })),
        Date.now(),
      );
      if (names.length === 0) return;
      const deleted = await bucket.remove(names.map((name) => `${prefix}/${name}`));
      if (deleted.error) {
        logSupabaseClientError("pulsar.backup.cleanup", deleted.error, { prefix });
        return;
      }
      removed += names.length;
    };
    await sweep("jobs");
    await sweep("ready");
    const incoming = await bucket.list("incoming", { limit: 100 });
    if (!incoming.error) {
      for (const folder of incoming.data ?? []) {
        if (!folder.name || folder.name.includes("..")) continue;
        await sweep(`incoming/${folder.name}`);
      }
    }
    return NextResponse.json({ ok: true, removed });
  } catch (error) {
    logServerException("api/cron/institute-backups-cleanup", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

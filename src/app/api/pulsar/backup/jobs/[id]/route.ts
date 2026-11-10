import { readOwnedBackupJob } from "@/lib/pulsar/backup/readOwnedBackupJob";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return readOwnedBackupJob(id);
}

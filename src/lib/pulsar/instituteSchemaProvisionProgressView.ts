import type { LongJobSnapshot } from "@/types/longJob";

export type ProvisionProgressRecord = {
  status: string;
  phase: string;
  file_name: string | null;
  applied_count: number;
  total_count: number;
  files: string[] | null;
};

export type ProvisionPhaseCopy = {
  schema: string;
  migration: string;
  grants: string;
  done: string;
  failed: string;
};

export function buildProvisionJobSnapshot(row: ProvisionProgressRecord | null): LongJobSnapshot {
  if (!row) {
    return { status: "idle", current: 0, total: 0, message: "schema", fileName: null, activity: [] };
  }
  const files = row.files ?? [];
  return {
    status: row.status,
    current: row.applied_count,
    total: row.total_count,
    message: row.phase,
    fileName: row.file_name,
    activity: files.map((file) => ({ code: "migration", meta: { file } })),
  };
}

export function provisionPrimaryLine(snapshot: LongJobSnapshot, copy: ProvisionPhaseCopy): string {
  const fileName = typeof snapshot.fileName === "string" ? snapshot.fileName : "";
  const withFile = (template: string) => template.replaceAll("{file}", fileName);
  if (snapshot.status === "failed") return withFile(copy.failed);
  if (snapshot.status === "succeeded" || snapshot.message === "done") return copy.done;
  if (snapshot.message === "grants") return copy.grants;
  if (snapshot.message === "migration") return withFile(copy.migration);
  return copy.schema;
}

export function provisionActivityLines(snapshot: LongJobSnapshot | null): string[] {
  const activity = snapshot?.activity;
  if (!Array.isArray(activity)) return [];
  return activity.flatMap((item) => {
    if (!item || typeof item !== "object" || !("meta" in item)) return [];
    const meta = item.meta;
    if (!meta || typeof meta !== "object" || !("file" in meta)) return [];
    return typeof meta.file === "string" && meta.file.length > 0 ? [meta.file] : [];
  });
}

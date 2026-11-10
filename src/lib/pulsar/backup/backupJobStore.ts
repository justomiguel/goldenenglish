import "server-only";

import { createPulsarAdminClient } from "@/lib/supabase/pulsar";

export const INSTITUTE_BACKUPS_BUCKET = "institute-backups";

export type BackupJobState = {
  id: string;
  ownerId: string;
  status: "running" | "done" | "error";
  activity: { t: number; code: string }[];
  current: number;
  total: number;
  errorCode?: string;
  downloadUrl?: string;
  downloadName?: string;
  imagesSkipped?: boolean;
  updatedAt: number;
};

function body(job: BackupJobState): Blob {
  return new Blob([JSON.stringify(job)], { type: "application/json" });
}

export async function writeBackupJob(job: BackupJobState): Promise<void> {
  const admin = createPulsarAdminClient();
  const { error } = await admin.storage.from(INSTITUTE_BACKUPS_BUCKET).upload(`jobs/${job.id}.json`, body(job), {
    contentType: "application/json",
    upsert: true,
  });
  if (error) throw error;
}

export async function readBackupJob(id: string): Promise<BackupJobState | null> {
  const admin = createPulsarAdminClient();
  const { data, error } = await admin.storage.from(INSTITUTE_BACKUPS_BUCKET).download(`jobs/${id}.json`);
  if (error || !data) return null;
  return JSON.parse(await data.text()) as BackupJobState;
}

export async function uploadBackupObject(path: string, bytes: Uint8Array, contentType: string): Promise<boolean> {
  const admin = createPulsarAdminClient();
  const { error } = await admin.storage.from(INSTITUTE_BACKUPS_BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
  });
  return !error;
}

export async function downloadBackupObject(path: string): Promise<Uint8Array | null> {
  const admin = createPulsarAdminClient();
  const { data, error } = await admin.storage.from(INSTITUTE_BACKUPS_BUCKET).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

export async function signBackupObject(path: string): Promise<string | null> {
  const admin = createPulsarAdminClient();
  const signed = await admin.storage.from(INSTITUTE_BACKUPS_BUCKET).createSignedUrl(path, 3600);
  return signed.data?.signedUrl ?? null;
}

export async function signBackupUpload(path: string): Promise<{ token: string; path: string } | null> {
  const admin = createPulsarAdminClient();
  const signed = await admin.storage.from(INSTITUTE_BACKUPS_BUCKET).createSignedUploadUrl(path);
  if (signed.error || !signed.data?.token) return null;
  return { token: signed.data.token, path };
}

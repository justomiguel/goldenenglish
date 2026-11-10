"use server";

import { after } from "next/server";
import { backupExportDenial, backupImportDenial } from "@/lib/pulsar/backup/backupAccess";
import {
  INSTITUTE_BACKUPS_BUCKET,
  signBackupUpload,
  writeBackupJob,
} from "@/lib/pulsar/backup/backupJobStore";
import { runInstituteBackupExport } from "@/lib/pulsar/backup/runInstituteBackupExport";
import { runInstituteBackupImport } from "@/lib/pulsar/backup/runInstituteBackupImport";
import { logServerActionException, logServerWarn } from "@/lib/logging/serverActionLog";
import { resolvePulsarSiteActor } from "@/lib/pulsar/pulsarSiteActor";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { loadPulsarTenantBySlugForAdmin } from "@/lib/pulsar/pulsarTenantStore";
import { verifyUserPassword } from "@/lib/supabase/verifyUserPassword";
import { readPulsarSupabasePublicEnv } from "@/lib/supabase/pulsar";

type BackupResult = { ok: true; jobId: string } | { ok: false; code: string };

async function deny(scope: string, code: string, slug: string): Promise<{ ok: false; code: string }> {
  await logServerWarn(scope, { code, slug });
  return { ok: false, code };
}

export async function startInstituteBackupExportAction(args: {
  locale: string;
  slug: string;
  password: string;
  passphrase: string;
  passphraseAgain: string;
}): Promise<BackupResult> {
  try {
    const actor = await resolvePulsarSiteActor(args.slug);
    const tenant = await loadPulsarTenantBySlugForAdmin(args.slug);
    const passwordOk =
      actor.kind === "staff" || actor.kind === "owner"
        ? await verifyUserPassword(actor.email, args.password)
        : false;
    const code = backupExportDenial({
      actorKind: actor.kind,
      mustChangePassword: actor.kind === "staff" ? actor.mustChangePassword : false,
      passwordOk,
      passphrase: args.passphrase,
      passphraseAgain: args.passphraseAgain,
      dataMode: tenant?.dataMode ?? null,
    });
    if (code) return deny("pulsar.backup.export", code, args.slug);
    if (actor.kind !== "staff" && actor.kind !== "owner") return deny("pulsar.backup.export", "unauthorized", args.slug);
    const jobId = crypto.randomUUID();
    await writeBackupJob({
      id: jobId,
      ownerId: actor.userId,
      status: "running",
      activity: [],
      current: 0,
      total: 1,
      updatedAt: Date.now(),
    });
    after(() =>
      runInstituteBackupExport({
        jobId,
        ownerId: actor.userId,
        email: actor.email,
        slug: args.slug,
        passphrase: args.passphrase,
      }),
    );
    return { ok: true, jobId };
  } catch (err) {
    logServerActionException("pulsar.backup.export", err, { slug: args.slug });
    return { ok: false, code: "storage_failed" };
  }
}

export async function prepareInstituteBackupUploadAction(args: {
  password: string;
  passphrase: string;
}): Promise<{ ok: true; path: string; token: string; supabaseUrl: string; bucket: string } | { ok: false; code: string }> {
  try {
    const session = await getPulsarStaffSession();
    const code = backupImportDenial({
      actorKind: session ? "staff" : "forbidden",
      mustChangePassword: session?.mustChangePassword ?? false,
      passwordOk: session ? await verifyUserPassword(session.email, args.password) : false,
      passphrase: args.passphrase,
    });
    if (code || !session) return deny("pulsar.backup.import", code ?? "unauthorized", "");
    const path = `incoming/${session.userId}/${crypto.randomUUID()}.cbk`;
    const signed = await signBackupUpload(path);
    if (!signed) return deny("pulsar.backup.import", "storage_failed", "");
    return {
      ok: true,
      path,
      token: signed.token,
      supabaseUrl: readPulsarSupabasePublicEnv().url,
      bucket: INSTITUTE_BACKUPS_BUCKET,
    };
  } catch (err) {
    logServerActionException("pulsar.backup.import", err, {});
    return { ok: false, code: "storage_failed" };
  }
}

export async function startInstituteBackupImportAction(args: {
  locale: string;
  objectPath: string;
  password: string;
  passphrase: string;
}): Promise<BackupResult> {
  try {
    const session = await getPulsarStaffSession();
    const code = backupImportDenial({
      actorKind: session ? "staff" : "forbidden",
      mustChangePassword: session?.mustChangePassword ?? false,
      passwordOk: session ? await verifyUserPassword(session.email, args.password) : false,
      passphrase: args.passphrase,
    });
    if (code || !session) return deny("pulsar.backup.import", code ?? "unauthorized", "");
    if (!args.objectPath.startsWith(`incoming/${session.userId}/`) || args.objectPath.includes("..")) {
      return deny("pulsar.backup.import", "file_corrupt", "");
    }
    const jobId = crypto.randomUUID();
    await writeBackupJob({
      id: jobId,
      ownerId: session.userId,
      status: "running",
      activity: [],
      current: 0,
      total: 1,
      updatedAt: Date.now(),
    });
    after(() =>
      runInstituteBackupImport({
        jobId,
        ownerId: session.userId,
        email: session.email,
        objectPath: args.objectPath,
        passphrase: args.passphrase,
        locale: args.locale,
      }),
    );
    return { ok: true, jobId };
  } catch (err) {
    logServerActionException("pulsar.backup.import", err, {});
    return { ok: false, code: "storage_failed" };
  }
}

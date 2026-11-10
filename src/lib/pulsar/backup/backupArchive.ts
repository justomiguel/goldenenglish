import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { unzipSync, zipSync } from "fflate";
import { z } from "zod";

const scryptAsync = promisify(scrypt);
const MAGIC = Buffer.from("GEBK");
const VERSION = 1;
const PASSPHRASE_MIN = 12;

const manifestSchema = z.object({
  formatVersion: z.literal(1),
  slug: z.string().min(1),
  exportedAt: z.string().min(1),
  actorId: z.string().min(1),
  lastMigration: z.string().nullable(),
  entries: z.array(
    z.object({
      name: z.string().min(1),
      sha256: z.string().length(64),
      bytes: z.number().int().nonnegative(),
    }),
  ),
});

export type BackupManifest = z.infer<typeof manifestSchema>;

export type BackupOpenResult =
  | { ok: true; manifest: BackupManifest; files: Record<string, Uint8Array> }
  | { ok: false; code: "wrong_passphrase" | "file_corrupt" | "format_unsupported" };

export function validatePassphrasePair(
  passphrase: string,
  again: string,
): "ok" | "passphrase_too_short" | "passphrase_mismatch" {
  if (passphrase.length < PASSPHRASE_MIN) return "passphrase_too_short";
  if (passphrase !== again) return "passphrase_mismatch";
  return "ok";
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function backupFileName(slug: string, when: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = `${when.getUTCFullYear()}${pad(when.getUTCMonth() + 1)}${pad(when.getUTCDate())}-${pad(when.getUTCHours())}${pad(when.getUTCMinutes())}`;
  return `${slug}-backup-${stamp}.cbk`;
}

function safeZipName(name: string): boolean {
  if (!name || name.startsWith("/") || name.includes("\\") || name.includes("..")) return false;
  return name.split("/").every((part) => part.length > 0 && part !== ".");
}

export function packBackupFiles(
  files: Record<string, Uint8Array>,
  meta: Omit<BackupManifest, "formatVersion" | "entries">,
): Record<string, Uint8Array> {
  const entries = Object.keys(files)
    .sort()
    .map((name) => {
      const bytes = files[name] ?? new Uint8Array();
      return { name, sha256: sha256Hex(bytes), bytes: bytes.byteLength };
    });
  const manifest: BackupManifest = { formatVersion: 1, ...meta, entries };
  const body = new TextEncoder().encode(`${JSON.stringify(manifest)}\n`);
  return { ...files, "manifest.json": body };
}

export async function sealBackup(
  packed: Record<string, Uint8Array>,
  passphrase: string,
): Promise<Uint8Array> {
  if (passphrase.length < PASSPHRASE_MIN) {
    throw new Error("passphrase_too_short");
  }
  const zipped = zipSync(packed);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = (await scryptAsync(passphrase, salt, 32)) as Buffer;
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(zipped), cipher.final(), cipher.getAuthTag()]);
  return Buffer.concat([MAGIC, Buffer.from([VERSION]), salt, iv, encrypted]);
}

export async function openBackup(bytes: Uint8Array, passphrase: string): Promise<BackupOpenResult> {
  if (bytes.byteLength < 4 + 1 + 16 + 12 + 16) return { ok: false, code: "file_corrupt" };
  const header = Buffer.from(bytes);
  if (!header.subarray(0, 4).equals(MAGIC)) return { ok: false, code: "file_corrupt" };
  if (header[4] !== VERSION) return { ok: false, code: "format_unsupported" };
  const salt = header.subarray(5, 21);
  const iv = header.subarray(21, 33);
  const tag = header.subarray(header.length - 16);
  const encrypted = header.subarray(33, header.length - 16);
  let plain: Buffer;
  try {
    const key = (await scryptAsync(passphrase, salt, 32)) as Buffer;
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    plain = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  } catch {
    return { ok: false, code: "wrong_passphrase" };
  }
  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(plain);
  } catch {
    return { ok: false, code: "file_corrupt" };
  }
  if (Object.keys(unzipped).some((name) => !safeZipName(name))) {
    return { ok: false, code: "file_corrupt" };
  }
  const manifestBytes = unzipped["manifest.json"];
  if (!manifestBytes) return { ok: false, code: "file_corrupt" };
  let parsed: BackupManifest;
  try {
    parsed = manifestSchema.parse(JSON.parse(new TextDecoder().decode(manifestBytes)));
  } catch (err) {
    if (err instanceof z.ZodError && err.issues.some((issue) => issue.path[0] === "formatVersion")) {
      return { ok: false, code: "format_unsupported" };
    }
    return { ok: false, code: "file_corrupt" };
  }
  const listed = new Set(parsed.entries.map((entry) => entry.name));
  const present = Object.keys(unzipped).filter((name) => name !== "manifest.json");
  if (present.length !== listed.size || present.some((name) => !listed.has(name))) {
    return { ok: false, code: "file_corrupt" };
  }
  for (const entry of parsed.entries) {
    const file = unzipped[entry.name];
    if (!file || file.byteLength !== entry.bytes || sha256Hex(file) !== entry.sha256) {
      return { ok: false, code: "file_corrupt" };
    }
  }
  return { ok: true, manifest: parsed, files: unzipped };
}

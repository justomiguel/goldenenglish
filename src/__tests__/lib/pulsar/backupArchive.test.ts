/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  backupFileName,
  openBackup,
  packBackupFiles,
  sealBackup,
  sha256Hex,
  validatePassphrasePair,
} from "@/lib/pulsar/backup/backupArchive";

const meta = {
  slug: "club",
  exportedAt: "2026-11-09T19:00:00.000Z",
  actorId: "actor-1",
  lastMigration: "006_institute_data_plane.sql",
};

describe("backup archive", () => {
  it("seals a file and opens it with the same passphrase", async () => {
    const packed = packBackupFiles(
      { "tenant.json": new TextEncoder().encode('{"slug":"club"}\n') },
      meta,
    );
    const sealed = await sealBackup(packed, "correct horse battery");
    const opened = await openBackup(sealed, "correct horse battery");
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    expect(opened.manifest.slug).toBe("club");
    expect(new TextDecoder().decode(opened.files["tenant.json"])).toContain("club");
    expect(backupFileName("club", new Date("2026-11-09T19:38:00.000Z"))).toBe(
      "club-backup-20261109-1938.cbk",
    );
  });

  it("rejects a short passphrase and a mismatch before sealing", () => {
    expect(validatePassphrasePair("short", "short")).toBe("passphrase_too_short");
    expect(validatePassphrasePair("correct horse battery", "other horse battery")).toBe(
      "passphrase_mismatch",
    );
  });

  it("reports a wrong passphrase", async () => {
    const sealed = await sealBackup(packBackupFiles({ "a.txt": new Uint8Array([1]) }, meta), "correct horse battery");
    const opened = await openBackup(sealed, "another horse battery");
    expect(opened).toEqual({ ok: false, code: "wrong_passphrase" });
  });

  it("reports a damaged checksum", async () => {
    const packed = packBackupFiles({ "a.txt": new Uint8Array([1, 2, 3]) }, meta);
    const file = packed["a.txt"];
    if (!file) throw new Error("missing");
    file[0] = 9;
    const sealed = await sealBackup(packed, "correct horse battery");
    const opened = await openBackup(sealed, "correct horse battery");
    expect(opened).toEqual({ ok: false, code: "file_corrupt" });
    expect(sha256Hex(new Uint8Array([1]))).toHaveLength(64);
  });

  it("reports a version this app does not read", async () => {
    const sealed = Buffer.from(
      await sealBackup(packBackupFiles({ "a.txt": new Uint8Array([1]) }, meta), "correct horse battery"),
    );
    sealed[4] = 2;
    const opened = await openBackup(sealed, "correct horse battery");
    expect(opened).toEqual({ ok: false, code: "format_unsupported" });
  });
});

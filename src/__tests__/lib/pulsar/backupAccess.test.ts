import { describe, expect, it } from "vitest";
import { backupExportDenial, backupImportDenial } from "@/lib/pulsar/backup/backupAccess";
import { staleBackupNames } from "@/lib/pulsar/backup/staleBackupNames";

describe("backup access", () => {
  const base = {
    actorKind: "staff" as const,
    mustChangePassword: false,
    passwordOk: true,
    passphrase: "correct horse battery",
    passphraseAgain: "correct horse battery",
    dataMode: "shared_schema",
  };

  it("allows staff and the owner to export a shared institute", () => {
    expect(backupExportDenial(base)).toBeNull();
    expect(backupExportDenial({ ...base, actorKind: "owner" })).toBeNull();
  });

  it("refuses the wrong password, a project database, and an import by an owner", () => {
    expect(backupExportDenial({ ...base, passwordOk: false })).toBe("step_up_failed");
    expect(backupExportDenial({ ...base, dataMode: "project" })).toBe("not_shared_schema");
    expect(backupExportDenial({ ...base, mustChangePassword: true })).toBe("password_change_required");
    expect(
      backupImportDenial({
        actorKind: "owner",
        mustChangePassword: false,
        passwordOk: true,
        passphrase: "correct horse battery",
      }),
    ).toBe("unauthorized");
  });
});

describe("stale backup objects", () => {
  it("keeps a fresh file and returns an old one", () => {
    const now = Date.parse("2026-11-09T00:00:00.000Z");
    const names = staleBackupNames(
      [
        { name: "fresh.cbk", createdAt: "2026-11-08T00:00:00.000Z" },
        { name: "old.cbk", createdAt: "2026-10-01T00:00:00.000Z" },
        { name: "../escape.cbk", createdAt: "2026-10-01T00:00:00.000Z" },
      ],
      now,
    );
    expect(names).toEqual(["old.cbk"]);
  });
});

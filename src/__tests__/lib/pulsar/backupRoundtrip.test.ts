/** @vitest-environment node */
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { openBackup, packBackupFiles, sealBackup } from "@/lib/pulsar/backup/backupArchive";
import { buildInstituteBackupFiles } from "@/lib/pulsar/backup/buildInstituteBackup";
import { restoreInstituteBackup, type RestorePorts } from "@/lib/pulsar/backup/restoreInstituteBackup";

const schema = "tenant_club";

function query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }> {
  if (sql.includes("institute_migration_ledger")) {
    return Promise.resolve({ rows: [{ file_name: "006_institute_data_plane.sql" }] });
  }
  if (sql.includes("pg_class c")) {
    return Promise.resolve({ rows: [{ name: "profiles" }] });
  }
  if (sql.includes("information_schema.columns") && params?.[1] === "profiles") {
    return Promise.resolve({ rows: [{ column_name: "id" }, { column_name: "name" }] });
  }
  if (sql.startsWith("SELECT")) {
    if (sql.includes("auth.users")) {
      return Promise.resolve({
        rows: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            email: "student@example.com",
            encrypted_password: "hash",
            raw_user_meta_data: { tenant_schema: schema },
            raw_app_meta_data: {},
          },
        ],
      });
    }
    if (sql.includes("auth.identities")) return Promise.resolve({ rows: [] });
    if (sql.includes('"profiles"')) {
      return Promise.resolve({ rows: [{ id: "p1", name: "Ada" }] });
    }
  }
  return Promise.resolve({ rows: [] });
}

describe("institute backup round trip", () => {
  it("packs rows, the account, and the logo, then restores them", async () => {
    const built = await buildInstituteBackupFiles({
      query,
      schema,
      tenantJson: JSON.stringify({
        slug: "club",
        hosts: ["club.example.com"],
        postgresSchema: schema,
      }),
      buckets: ["landing-media"],
      listStorage: async (bucket, prefix) => {
        if (bucket === "landing-media" && prefix === schema) {
          return [{ name: "institute-public", id: null }];
        }
        if (prefix === `${schema}/institute-public`) return [{ name: "logo.png", id: "file" }];
        return [];
      },
      downloadStorage: async () => new Uint8Array([1, 2, 3]),
    });
    const sealed = await sealBackup(
      packBackupFiles(built.files, {
        slug: "club",
        exportedAt: "2026-11-09T19:00:00.000Z",
        actorId: "actor",
        lastMigration: built.lastMigration,
      }),
      "correct horse battery",
    );
    const opened = await openBackup(sealed, "correct horse battery");
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const inserted: string[] = [];
    const uploaded: string[] = [];
    const root = mkdtempSync(path.join(tmpdir(), "ge-backup-"));
    const ports: RestorePorts = {
      query: async (sql) => {
        if (sql.includes("information_schema.columns")) {
          return { rows: [{ column_name: "id" }, { column_name: "name" }] };
        }
        if (sql.includes("pg_constraint")) return { rows: [] };
        inserted.push(sql);
        return { rows: [] };
      },
      slugTaken: async () => false,
      schemaExists: async () => false,
      occupiedHosts: async () => [],
      existingAuth: async () => ({ ids: [], emails: [] }),
      deployedMigrations: ["006_institute_data_plane.sql"],
      insertTenant: async () => true,
      provision: async () => true,
      upload: async (_bucket, objectPath) => {
        uploaded.push(objectPath);
        return true;
      },
      attachHosts: async () => true,
      rollback: async () => undefined,
      imageRoot: root,
    };
    const restored = await restoreInstituteBackup(opened.files, opened.manifest.lastMigration, ports);
    expect(restored).toEqual({ ok: true, imagesSkipped: false });
    expect(inserted.some((sql) => sql.includes("INSERT INTO"))).toBe(true);
    expect(uploaded).toEqual([`${schema}/institute-public/logo.png`]);
    expect(readFileSync(path.join(root, "public/images/club/logo.png"))[0]).toBe(1);
  });

  it("rolls back when a table column is missing", async () => {
    const rolled: string[] = [];
    const result = await restoreInstituteBackup(
      {
        "tenant.json": new TextEncoder().encode(
          JSON.stringify({ slug: "club", hosts: [], postgresSchema: schema }),
        ),
        "schema/profiles.ndjson": new TextEncoder().encode('{"id":"1","gone":true}\n'),
        "auth/users.ndjson": new TextEncoder().encode(""),
        "auth/identities.ndjson": new TextEncoder().encode(""),
      },
      "006_institute_data_plane.sql",
      {
        query: async (sql) => {
          if (sql.includes("information_schema.columns")) return { rows: [{ column_name: "id" }] };
          if (sql.includes("pg_constraint")) return { rows: [] };
          return { rows: [] };
        },
        slugTaken: async () => false,
        schemaExists: async () => false,
        occupiedHosts: async () => [],
        existingAuth: async () => ({ ids: [], emails: [] }),
        deployedMigrations: ["006_institute_data_plane.sql"],
        insertTenant: async () => true,
        provision: async () => true,
        upload: async () => true,
        attachHosts: async () => true,
        rollback: async (slug) => {
          rolled.push(slug);
        },
      },
    );
    expect(result).toEqual({ ok: false, code: "schema_load_failed" });
    expect(rolled).toEqual(["club"]);
  });

  it("does not write when the slug already exists", async () => {
    let inserted = false;
    const result = await restoreInstituteBackup(
      {
        "tenant.json": new TextEncoder().encode(
          JSON.stringify({ slug: "club", hosts: [], postgresSchema: schema }),
        ),
      },
      null,
      {
        query: async () => ({ rows: [] }),
        slugTaken: async () => true,
        schemaExists: async () => false,
        occupiedHosts: async () => [],
        existingAuth: async () => ({ ids: [], emails: [] }),
        deployedMigrations: [],
        insertTenant: async () => {
          inserted = true;
          return true;
        },
        provision: async () => true,
        upload: async () => true,
        attachHosts: async () => true,
        rollback: async () => undefined,
      },
    );
    expect(result).toEqual({ ok: false, code: "slug_taken" });
    expect(inserted).toBe(false);
  });
});

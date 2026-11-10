import { describe, expect, it } from "vitest";
import { restoreRefusal, type RestoreFacts } from "@/lib/pulsar/backup/backupPreflight";
import { tableLoadOrder } from "@/lib/pulsar/backup/tableLoadOrder";
import { collectTenantStoragePaths } from "@/lib/pulsar/backup/collectTenantStoragePaths";
import { columnPlan, quoteIdent, selectPageSql } from "@/lib/pulsar/backup/backupSql";
import { backupErrorSentence } from "@/lib/pulsar/backup/backupErrorSentence";
import { documentOmitsSharedCredentials, tenantBackupDocument } from "@/lib/pulsar/backup/tenantBackupDocument";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";

function facts(patch: Partial<RestoreFacts> = {}): RestoreFacts {
  return {
    lastMigration: "006_institute_data_plane.sql",
    deployedMigrations: ["006_institute_data_plane.sql"],
    slugTaken: false,
    schemaExists: false,
    hosts: ["club.example.com"],
    occupiedHosts: [],
    authIds: ["user-1"],
    existingAuthIds: [],
    authEmails: ["student@example.com"],
    existingAuthEmails: [],
    ...patch,
  };
}

describe("restore preflight", () => {
  it("allows a backup this deploy can load", () => {
    expect(restoreRefusal(facts())).toBeNull();
  });

  it("refuses each collision before a write", () => {
    expect(restoreRefusal(facts({ slugTaken: true }))).toBe("slug_taken");
    expect(restoreRefusal(facts({ schemaExists: true }))).toBe("schema_exists");
    expect(restoreRefusal(facts({ occupiedHosts: ["club.example.com"] }))).toBe("host_taken");
    expect(restoreRefusal(facts({ existingAuthIds: ["user-1"] }))).toBe("auth_user_exists");
    expect(restoreRefusal(facts({ existingAuthEmails: ["Student@example.com"] }))).toBe(
      "auth_user_exists",
    );
    expect(restoreRefusal(facts({ lastMigration: "999_future.sql" }))).toBe("backup_newer_than_app");
  });
});

describe("table load order", () => {
  it("loads a referenced table first and ignores a self reference", () => {
    expect(
      tableLoadOrder([
        { name: "payments", references: ["profiles", "payments"] },
        { name: "profiles", references: [] },
      ]),
    ).toEqual(["profiles", "payments"]);
  });
});

describe("storage prefix walk", () => {
  it("keeps files under the schema and skips a path that climbs out", async () => {
    const paths = await collectTenantStoragePaths(async (prefix) => {
      if (prefix === "tenant_club") {
        return [
          { name: "institute-public", id: null },
          { name: "receipt.pdf", id: "file-1" },
        ];
      }
      if (prefix === "tenant_club/institute-public") {
        return [
          { name: "logo.png", id: "file-2" },
          { name: "../tenant_other/secret.png", id: "file-3" },
        ];
      }
      return [];
    }, "tenant_club");
    expect(paths).toEqual([
      "tenant_club/receipt.pdf",
      "tenant_club/institute-public/logo.png",
    ]);
    expect(await collectTenantStoragePaths(async () => [], "public")).toEqual([]);
  });
});

describe("backup sql", () => {
  it("pages at most 1000 rows and refuses a column the live table lacks", () => {
    expect(selectPageSql("tenant_club", "profiles", ["id", "name"], 5000, 0)).toContain("LIMIT 1000");
    expect(quoteIdent("id")).toBe('"id"');
    expect(columnPlan(["id", "gone"], ["id", "name"])).toEqual({
      ok: false,
      code: "schema_load_failed",
    });
  });
});

describe("backup errors and tenant document", () => {
  it("shows a known sentence and the raw code when the sentence is missing", () => {
    const errors = { slug_taken: "This id exists. Code: slug_taken" };
    expect(backupErrorSentence(errors, "slug_taken")).toBe(errors.slug_taken);
    expect(backupErrorSentence(errors, "mystery_code")).toBe("mystery_code");
  });

  it("omits the shared Pulsar credentials", () => {
    const tenant = {
      slug: "club",
      displayName: "Club",
      isEnabled: true,
      updatedAt: null,
      hosts: ["club.example.com"],
      supabaseUrl: "https://pulsar.supabase.co",
      supabaseAnonKey: "anon",
      supabaseServiceRoleKey: "service",
      databaseUrl: "postgres://pulsar",
      brandThemeSlug: "generic-deportes",
      mailTenant: null,
      resendFromEmail: "hola@club.test",
      resendApiKey: "re_test",
      publicUrl: null,
      paymentGatewaySecretEncryptionKey: null,
      whatsappAccessToken: null,
      whatsappPhoneNumberId: null,
      whatsappClassReminderTemplateName: null,
      vapidPublicKey: null,
      vapidPrivateKey: null,
      vapidContactEmail: null,
      googleMapsApiKey: null,
      googleMapsMapId: null,
      kvRestApiUrl: null,
      kvRestApiToken: null,
      debugLogin: false,
      skipInitialSiteSetup: true,
      dataMode: "shared_schema",
      postgresSchema: "tenant_club",
    } satisfies PulsarTenantRecord;
    const document = tenantBackupDocument(tenant);
    expect(documentOmitsSharedCredentials(document)).toBe(true);
    expect(document.resendApiKey).toBe("re_test");
    expect(document.postgresSchema).toBe("tenant_club");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";

const state = vi.hoisted(() => ({
  blockDrop: false,
  queries: [] as { sql: string; params?: unknown[] }[],
  deleted: [] as string[],
  removed: [] as string[][],
}));

vi.mock("@/lib/tenant/institutePublicImagePack", () => ({
  removeInstitutePublicImageDir: () => undefined,
}));

vi.mock("pg", () => ({
  default: {
    Client: class {
      async connect() {}
      async end() {}
      async query(sql: string, params?: unknown[]) {
        state.queries.push({ sql, params });
        if (sql.includes("pg_roles")) {
          return { rows: [{ rolconfig: ["pgrst.db_schemas=public,storage,tenant_other,tenant_club"] }] };
        }
        if (sql.includes("pg_constraint") && state.blockDrop) return { rows: [{ nspname: "tenant_other" }] };
        if (sql.includes("pg_constraint") || sql.includes("pg_rewrite")) return { rows: [] };
        return { rows: [], rowCount: 1 };
      }
    },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClientFromCredentials: () => ({
    auth: {
      admin: {
        listUsers: async () => ({
          data: {
            users: [
              { id: "mine", user_metadata: { tenant_schema: "tenant_club" } },
              { id: "other", user_metadata: { tenant_schema: "tenant_other" } },
              { id: "plain", user_metadata: {} },
            ],
          },
          error: null,
        }),
        deleteUser: async (id: string) => {
          state.deleted.push(id);
        },
      },
    },
    storage: {
      from: () => ({
        list: async () => ({
          data: [{ name: "logo.png" }, { name: "../tenant_other/secret.png" }],
          error: null,
        }),
        remove: async (paths: string[]) => {
          state.removed.push(paths);
          return { error: null };
        },
      }),
    },
  }),
}));

import { closeInstituteDataPlane } from "@/lib/pulsar/closeInstituteDataPlane";

function tenant(): PulsarTenantRecord {
  return {
    slug: "club",
    displayName: "Club",
    isEnabled: true,
    updatedAt: null,
    hosts: ["club.centrolisto.cl", "centrolisto.cl", "shared.example.com"],
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "anon",
    supabaseServiceRoleKey: "service",
    databaseUrl: "postgres://example",
    brandThemeSlug: "generic-deportes",
    mailTenant: null,
    resendFromEmail: null,
    resendApiKey: null,
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
  };
}

describe("closeInstituteDataPlane", () => {
  const previousToken = process.env.VERCEL_TOKEN;
  const previousProject = process.env.VERCEL_PROJECT_ID;

  afterEach(() => {
    state.blockDrop = false;
    state.queries = [];
    state.deleted = [];
    state.removed = [];
    process.env.VERCEL_TOKEN = previousToken;
    process.env.VERCEL_PROJECT_ID = previousProject;
    vi.unstubAllGlobals();
  });

  it("drops one schema and leaves the other site's host, user, and files", async () => {
    process.env.VERCEL_TOKEN = "token";
    process.env.VERCEL_PROJECT_ID = "prj_centro";
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await closeInstituteDataPlane(tenant(), ["shared.example.com"]);

    expect(result).toEqual({ ok: true });
    const dropped = state.queries.filter((query) => query.sql.includes("DROP SCHEMA"));
    expect(dropped).toEqual([{ sql: "DROP SCHEMA IF EXISTS tenant_club CASCADE", params: undefined }]);
    const ledger = state.queries.filter((query) => query.sql.includes("institute_migration_ledger"));
    expect(ledger.every((query) => query.params?.[0] === "tenant_club")).toBe(true);
    const hidden = state.queries.find((query) => query.sql.includes("ALTER ROLE"));
    expect(hidden?.sql).toContain("tenant_other");
    expect(hidden?.sql).toContain("public");
    expect(hidden?.sql).not.toContain("tenant_club");
    expect(state.deleted).toEqual(["mine"]);
    expect(state.removed).toEqual([["tenant_club/institute-public/logo.png"]]);
    const detached = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(detached.some((url) => url.includes("club.centrolisto.cl"))).toBe(true);
    expect(detached.some((url) => url.endsWith("/centrolisto.cl") || url.includes("/centrolisto.cl?"))).toBe(false);
    expect(detached.some((url) => url.includes("shared.example.com"))).toBe(false);
  });

  it("stops before the drop when another schema depends on this one", async () => {
    state.blockDrop = true;
    const result = await closeInstituteDataPlane(tenant(), ["shared.example.com"]);
    expect(result).toEqual({ ok: false, errorCode: "db_write_failed" });
    expect(state.queries.some((query) => query.sql.includes("DROP SCHEMA"))).toBe(false);
    expect(state.deleted).toEqual([]);
  });
});

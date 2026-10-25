import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const supabaseCreate = vi.fn(() => ({}));

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => (name === "host" ? "unknown.example" : null),
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...a: unknown[]) => supabaseCreate(...a),
}));

import { createAdminClient } from "@/lib/supabase/admin";

describe("createAdminClient", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    delete process.env.TENANTS_CONFIG_JSON;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("throws when service role key is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await expect(createAdminClient()).rejects.toThrow(/Missing SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("returns admin client when key is set", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-secret";
    const c = await createAdminClient();
    expect(c).toBeDefined();
    expect(supabaseCreate).toHaveBeenCalled();
  });

  it("does not use the shared service role key when multi-tenant mode cannot resolve a host", async () => {
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([
      {
        slug: "nago",
        hosts: ["capoeiranago.cl"],
        supabaseUrl: "https://nago.supabase.co",
        supabaseAnonKey: "anon-nago",
        supabaseServiceRoleKey: "service-nago",
      },
    ]);
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-shared";
    delete process.env.DEV_TENANT_SLUG;
    await expect(createAdminClient()).rejects.toThrow(/Missing SUPABASE_SERVICE_ROLE_KEY/);
  });
});

import { describe, expect, it } from "vitest";
import { supabasePublicEnvInlinedForClient } from "@/lib/supabase/clientBundleSupabaseEnv";

describe("supabasePublicEnvInlinedForClient", () => {
  it("leaves the client bundle empty when any institute is configured", () => {
    expect(
      supabasePublicEnvInlinedForClient({
        tenantCount: 6,
        singleTenantUrl: "https://one.supabase.co",
        singleTenantAnonKey: "anon-one",
      }),
    ).toEqual({ url: "", anonKey: "" });
  });

  it("inlines the single-tenant public env when no JSON tenants exist", () => {
    expect(
      supabasePublicEnvInlinedForClient({
        tenantCount: 0,
        singleTenantUrl: "https://e2e.supabase.co",
        singleTenantAnonKey: "anon-e2e",
      }),
    ).toEqual({ url: "https://e2e.supabase.co", anonKey: "anon-e2e" });
  });
});

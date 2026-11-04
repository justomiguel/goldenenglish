import { describe, expect, it } from "vitest";
import {
  authUserBelongsToSchema,
  exclusiveTenantHosts,
  sharedTenantStoragePrefix,
  storagePathsForTenant,
} from "@/lib/pulsar/tenantDeleteScope";

describe("tenantDeleteScope", () => {
  it("keeps platform apexes and hosts that belong to another site", () => {
    const hosts = exclusiveTenantHosts({
      hosts: ["club.centrolisto.cl", "centrolisto.cl", "shared.example.com", "club.localhost"],
      occupiedHosts: ["shared.example.com", "other.centrolisto.cl"],
      platformHosts: ["centrolisto.cl", "www.centrolisto.cl"],
    });
    expect(hosts).toEqual(["club.centrolisto.cl"]);
  });

  it("deletes an auth user only when the schema matches exactly", () => {
    expect(authUserBelongsToSchema({ tenant_schema: "tenant_club" }, "tenant_club")).toBe(true);
    expect(authUserBelongsToSchema({ tenant_schema: "tenant_other" }, "tenant_club")).toBe(false);
    expect(authUserBelongsToSchema({ tenant_schema: "tenant_club_extra" }, "tenant_club")).toBe(false);
    expect(authUserBelongsToSchema({}, "tenant_club")).toBe(false);
    expect(authUserBelongsToSchema({ tenant_schema: "tenant_club" }, "public")).toBe(false);
  });

  it("limits storage keys to one schema folder", () => {
    expect(sharedTenantStoragePrefix("public")).toBeNull();
    expect(sharedTenantStoragePrefix("tenant_club")).toBe("tenant_club/institute-public");
    expect(
      storagePathsForTenant("tenant_club/institute-public", ["logo.png", "../tenant_other/secret.png", "a/b.png"]),
    ).toEqual(["tenant_club/institute-public/logo.png"]);
  });
});

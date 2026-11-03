import { beforeEach, describe, expect, it, vi } from "vitest";

const getPulsarOwnerUserId = vi.fn();
const readInstituteSchemaProvisionSnapshot = vi.fn();

vi.mock("@/lib/pulsar/pulsarOwnerSession", () => ({
  getPulsarOwnerUserId: () => getPulsarOwnerUserId(),
}));

vi.mock("@/lib/pulsar/instituteSchemaProvisionProgress", () => ({
  readInstituteSchemaProvisionSnapshot: (...args: unknown[]) =>
    readInstituteSchemaProvisionSnapshot(...args),
}));

import { GET } from "@/app/api/cuenta/schema-provision/route";

describe("GET /api/cuenta/schema-provision", () => {
  beforeEach(() => {
    getPulsarOwnerUserId.mockReset();
    readInstituteSchemaProvisionSnapshot.mockReset();
  });

  it("rejects a caller who is not an owner", async () => {
    getPulsarOwnerUserId.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/cuenta/schema-provision?schema=tenant_club"));
    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(readInstituteSchemaProvisionSnapshot).not.toHaveBeenCalled();
  });

  it("returns only the signed-in owner's snapshot", async () => {
    getPulsarOwnerUserId.mockResolvedValue("owner-1");
    readInstituteSchemaProvisionSnapshot.mockResolvedValue({
      status: "running",
      current: 2,
      total: 8,
      message: "migration",
      fileName: "010_example.sql",
      activity: [],
    });
    const response = await GET(new Request("http://localhost/api/cuenta/schema-provision?schema=tenant_club"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(readInstituteSchemaProvisionSnapshot).toHaveBeenCalledWith("tenant_club", "owner-1");
    expect(await response.json()).toMatchObject({ status: "running", fileName: "010_example.sql" });
  });

  it("rejects a schema name outside tenant_<slug>", async () => {
    getPulsarOwnerUserId.mockResolvedValue("owner-1");
    const response = await GET(new Request("http://localhost/api/cuenta/schema-provision?schema=public"));
    expect(response.status).toBe(400);
    expect(readInstituteSchemaProvisionSnapshot).not.toHaveBeenCalled();
  });
});

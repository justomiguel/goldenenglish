import { beforeEach, describe, expect, it, vi } from "vitest";

const getPulsarStaffSession = vi.fn();
const readInstituteSchemaProvisionSnapshot = vi.fn();

vi.mock("@/lib/pulsar/pulsarStaffAuth", () => ({
  getPulsarStaffSession: () => getPulsarStaffSession(),
}));

vi.mock("@/lib/pulsar/instituteSchemaProvisionProgress", () => ({
  readInstituteSchemaProvisionSnapshot: (...args: unknown[]) =>
    readInstituteSchemaProvisionSnapshot(...args),
}));

import { GET } from "@/app/api/admin/pulsar/schema-provision/route";

describe("GET /api/admin/pulsar/schema-provision", () => {
  beforeEach(() => {
    getPulsarStaffSession.mockReset();
    readInstituteSchemaProvisionSnapshot.mockReset();
  });

  it("rejects a caller who is not Pulsar staff", async () => {
    getPulsarStaffSession.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/admin/pulsar/schema-provision?schema=tenant_test"));
    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(readInstituteSchemaProvisionSnapshot).not.toHaveBeenCalled();
  });

  it("returns the live migration snapshot for one institute schema", async () => {
    getPulsarStaffSession.mockResolvedValue({ userId: "staff-1", email: "a@b.c", mode: "pulsar-db" });
    readInstituteSchemaProvisionSnapshot.mockResolvedValue({
      status: "running",
      current: 4,
      total: 10,
      message: "migration",
      fileName: "010_example.sql",
      activity: [],
    });
    const response = await GET(new Request("http://localhost/api/admin/pulsar/schema-provision?schema=tenant_test"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(readInstituteSchemaProvisionSnapshot).toHaveBeenCalledWith("tenant_test");
    expect(await response.json()).toMatchObject({ status: "running", fileName: "010_example.sql" });
  });

  it("rejects a schema name outside tenant_<slug>", async () => {
    getPulsarStaffSession.mockResolvedValue({ userId: "staff-1", email: "a@b.c", mode: "pulsar-db" });
    const response = await GET(new Request("http://localhost/api/admin/pulsar/schema-provision?schema=public"));
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});

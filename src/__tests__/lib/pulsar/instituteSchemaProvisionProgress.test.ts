import { describe, expect, it } from "vitest";
import {
  buildProvisionJobSnapshot,
  provisionActivityLines,
  provisionPrimaryLine,
} from "@/lib/pulsar/instituteSchemaProvisionProgressView";

const copy = {
  schema: "Creating the schema",
  migration: "Applying {file}",
  grants: "Granting access",
  done: "Database ready",
  failed: "Stopped on {file}",
};

describe("buildProvisionJobSnapshot", () => {
  it("names the file that is running and lists files already applied", () => {
    const snapshot = buildProvisionJobSnapshot({
      status: "running",
      phase: "migration",
      file_name: "207_tenant_merch_shop.sql",
      applied_count: 12,
      total_count: 200,
      files: ["194_registration_enrollment_fee_checkout.sql"],
    });
    expect(provisionPrimaryLine(snapshot, copy)).toBe("Applying 207_tenant_merch_shop.sql");
    expect(provisionActivityLines(snapshot)).toEqual(["194_registration_enrollment_fee_checkout.sql"]);
    expect(snapshot.current).toBe(12);
    expect(snapshot.total).toBe(200);
  });

  it("keeps the failing file after the schema is discarded", () => {
    const snapshot = buildProvisionJobSnapshot({
      status: "failed",
      phase: "migration",
      file_name: "207_tenant_merch_shop.sql",
      applied_count: 12,
      total_count: 200,
      files: [],
    });
    expect(provisionPrimaryLine(snapshot, copy)).toBe("Stopped on 207_tenant_merch_shop.sql");
  });
});

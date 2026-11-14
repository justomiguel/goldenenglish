import { describe, expect, it } from "vitest";
import { parseRegistrationsListSearchParams } from "@/lib/dashboard/parseRegistrationsListSearchParams";

describe("parseRegistrationsListSearchParams", () => {
  it("opens pre-enrolled when the inbox value is unknown", () => {
    expect(parseRegistrationsListSearchParams({ inbox: "nope" }).inbox).toBe("registered");
  });

  it("keeps a known sort and a contacted inbox", () => {
    const params = parseRegistrationsListSearchParams({
      sort: "name",
      dir: "asc",
      inbox: "awaiting_payment",
      page: "2",
    });
    expect(params).toMatchObject({
      sort: "name",
      dir: "asc",
      inbox: "awaiting_payment",
      page: 2,
    });
  });
});

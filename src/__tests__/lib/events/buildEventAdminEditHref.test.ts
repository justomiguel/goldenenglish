import { describe, expect, it } from "vitest";
import { buildEventAdminEditHref } from "@/lib/events/buildEventAdminEditHref";

describe("buildEventAdminEditHref", () => {
  it("points to the admin event editor for the locale", () => {
    expect(buildEventAdminEditHref("es", "11111111-1111-4111-8111-111111111111")).toBe(
      "/es/dashboard/admin/events/11111111-1111-4111-8111-111111111111",
    );
  });
});

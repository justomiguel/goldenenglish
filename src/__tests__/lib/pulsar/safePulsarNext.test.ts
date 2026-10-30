import { describe, expect, it } from "vitest";
import { safePulsarNext } from "@/lib/pulsar/safePulsarNext";

describe("safePulsarNext", () => {
  it("keeps a same-locale path", () => {
    expect(safePulsarNext("es", "/es/admin")).toBe("/es/admin");
    expect(safePulsarNext("es", "/es/admin/tenants/nago/theme")).toBe(
      "/es/admin/tenants/nago/theme",
    );
  });

  it("drops an off-site or other-locale path", () => {
    expect(safePulsarNext("es", null)).toBeNull();
    expect(safePulsarNext("es", "https://evil.test/es/admin")).toBeNull();
    expect(safePulsarNext("es", "/en/admin")).toBeNull();
    expect(safePulsarNext("es", "/es")).toBeNull();
  });
});

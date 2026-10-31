import { describe, expect, it } from "vitest";
import { shouldDiscardPartialInstituteSchema } from "@/lib/pulsar/provisionSharedInstituteSchema";

describe("shouldDiscardPartialInstituteSchema", () => {
  it("discards a schema that has no saved institute", () => {
    expect(shouldDiscardPartialInstituteSchema(0)).toBe(true);
  });

  it("keeps a schema that already belongs to a saved institute", () => {
    expect(shouldDiscardPartialInstituteSchema(1)).toBe(false);
  });
});

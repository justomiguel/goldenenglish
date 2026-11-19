import { describe, expect, it } from "vitest";
import { parseDeliveryMode } from "@/lib/academics/sectionDeliveryMode";

describe("parseDeliveryMode", () => {
  it("keeps a known mode and falls back to in person", () => {
    expect(parseDeliveryMode("hybrid")).toBe("hybrid");
    expect(parseDeliveryMode("remote")).toBe("remote");
    expect(parseDeliveryMode("in_person")).toBe("in_person");
    expect(parseDeliveryMode("other")).toBe("in_person");
  });
});

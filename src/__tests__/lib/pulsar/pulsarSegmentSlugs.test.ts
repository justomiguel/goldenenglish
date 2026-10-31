import { describe, expect, it } from "vitest";
import { isPulsarSegmentSlug, PULSAR_SEGMENT_SLUGS } from "@/lib/pulsar/pulsarSegmentSlugs";

describe("pulsarSegmentSlugs", () => {
  it("accepts the five commercial segments and rejects unknown slugs", () => {
    expect(PULSAR_SEGMENT_SLUGS).toHaveLength(5);
    expect(isPulsarSegmentSlug("danza")).toBe(true);
    expect(isPulsarSegmentSlug("eventos")).toBe(true);
    expect(isPulsarSegmentSlug("precios")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { withPtFallback } from "@/lib/email/templates/withPtEmailDefaults";

describe("withPtFallback", () => {
  it("reuses Spanish packs for Portuguese defaults", () => {
    const es = { subject: "Hola", bodyHtml: "<p>x</p>" };
    const en = { subject: "Hi", bodyHtml: "<p>y</p>" };
    const d = withPtFallback({ es, en });
    expect(d.pt).toBe(es);
    expect(d.es).toBe(es);
    expect(d.en).toBe(en);
  });
});

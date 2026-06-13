import { describe, expect, it } from "vitest";
import { zodOptionalEmptyField, zodOptionalEmptyUrl } from "@/lib/validation/zodOptionalEmptyField";

describe("zodOptionalEmptyField", () => {
  const schema = z.object({
    note: zodOptionalEmptyField(z.string().trim().min(1).max(10)),
  });

  it("accepts missing key", () => {
    const r = schema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.note).toBeUndefined();
  });

  it("coerces empty string to undefined", () => {
    const r = schema.safeParse({ note: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.note).toBeUndefined();
  });

  it("validates non-empty values", () => {
    const r = schema.safeParse({ note: "ok" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.note).toBe("ok");
  });
});

describe("zodOptionalEmptyUrl", () => {
  it("accepts valid url or empty", () => {
    const field = zodOptionalEmptyUrl();
    expect(field.safeParse(undefined).success).toBe(true);
    expect(field.safeParse("").success).toBe(true);
    expect(field.safeParse("https://example.com").success).toBe(true);
    expect(field.safeParse("not-url").success).toBe(false);
  });
});

import { z } from "zod";

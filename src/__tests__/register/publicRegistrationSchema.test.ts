import { describe, it, expect } from "vitest";
import { publicRegistrationSchema } from "@/lib/register/publicRegistrationSchema";

describe("publicRegistrationSchema", () => {
  it("accepts valid payload", () => {
    const r = publicRegistrationSchema.safeParse({
      first_name: "Ana",
      last_name: "López",
      dni: "123",
      email: "a@b.com",
      phone: "+549",
      level_interest: "B1",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = publicRegistrationSchema.safeParse({
      first_name: "Ana",
      last_name: "López",
      dni: "123",
      email: "bad",
    });
    expect(r.success).toBe(false);
  });
});

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
      birth_date: "2010-06-15",
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
      phone: "+1",
      birth_date: "2010-01-01",
      level_interest: "A1",
    });
    expect(r.success).toBe(false);
  });

  it("rejects future birth_date", () => {
    const r = publicRegistrationSchema.safeParse({
      first_name: "Ana",
      last_name: "López",
      dni: "123",
      email: "a@b.com",
      phone: "+1",
      birth_date: "2099-12-31",
      level_interest: "A1",
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty phone or level", () => {
    const noPhone = publicRegistrationSchema.safeParse({
      first_name: "Ana",
      last_name: "López",
      dni: "123",
      email: "a@b.com",
      phone: "",
      birth_date: "2010-01-01",
      level_interest: "A1",
    });
    expect(noPhone.success).toBe(false);
    const noLevel = publicRegistrationSchema.safeParse({
      first_name: "Ana",
      last_name: "López",
      dni: "123",
      email: "a@b.com",
      phone: "+1",
      birth_date: "2010-01-01",
      level_interest: "  ",
    });
    expect(noLevel.success).toBe(false);
  });
});

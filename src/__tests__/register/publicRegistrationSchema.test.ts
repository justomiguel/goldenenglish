import { describe, it, expect } from "vitest";
import { buildPublicRegistrationSchema } from "@/lib/register/publicRegistrationSchema";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";

const SECTION_ID = "00000000-0000-4000-8000-000000000001";

const base = {
  first_name: "Ana",
  last_name: "López",
  dni: "123",
  email: "a@b.com",
  phone: "+549",
  preferred_section_id: SECTION_ID,
};

describe("buildPublicRegistrationSchema", () => {
  const schema = buildPublicRegistrationSchema(18);

  it("accepts valid adult payload", () => {
    const r = schema.safeParse({
      ...base,
      birth_date: "2000-06-15",
    });
    expect(r.success).toBe(true);
  });

  it("accepts undecided section choice", () => {
    const r = schema.safeParse({
      ...base,
      preferred_section_id: REGISTRATION_UNDECIDED_FORM_VALUE,
      birth_date: "2000-06-15",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = schema.safeParse({
      ...base,
      email: "bad",
      birth_date: "2010-01-01",
    });
    expect(r.success).toBe(false);
  });

  it("rejects future birth_date", () => {
    const r = schema.safeParse({
      ...base,
      birth_date: "2099-12-31",
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty phone or invalid section id", () => {
    const noPhone = schema.safeParse({
      ...base,
      phone: "",
      birth_date: "2010-01-01",
    });
    expect(noPhone.success).toBe(false);
    const noSection = schema.safeParse({
      ...base,
      birth_date: "2010-01-01",
      preferred_section_id: "",
    });
    expect(noSection.success).toBe(false);
  });

  it("rejects minor without tutor fields", () => {
    const r = schema.safeParse({
      ...base,
      birth_date: "2015-01-01",
    });
    expect(r.success).toBe(false);
  });

  it("accepts minor with tutor fields", () => {
    const r = schema.safeParse({
      ...base,
      birth_date: "2015-01-01",
      tutor_name: "María",
      tutor_dni: "999",
      tutor_email: "tutor@example.com",
      tutor_phone: "+54911",
      tutor_relationship: "Madre",
    });
    expect(r.success).toBe(true);
  });

  it("rejects minor when tutor email matches student email", () => {
    const r = schema.safeParse({
      ...base,
      email: "same@x.com",
      birth_date: "2015-01-01",
      tutor_name: "María",
      tutor_dni: "999",
      tutor_email: "same@x.com",
      tutor_phone: "+1",
      tutor_relationship: "Madre",
    });
    expect(r.success).toBe(false);
  });

  it("rejects minor when tutor DNI matches student DNI", () => {
    const r = schema.safeParse({
      ...base,
      dni: "111",
      birth_date: "2015-01-01",
      tutor_name: "María",
      tutor_dni: "111",
      tutor_email: "t@x.com",
      tutor_phone: "+1",
      tutor_relationship: "Madre",
    });
    expect(r.success).toBe(false);
  });
});

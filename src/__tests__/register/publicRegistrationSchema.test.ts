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

  it("rejects invalid email for adults", () => {
    const r = schema.safeParse({
      ...base,
      email: "bad",
      birth_date: "1990-01-01",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === "invalid")).toBe(true);
    }
  });

  it("rejects adult without email", () => {
    const r = schema.safeParse({
      ...base,
      email: "",
      birth_date: "2000-06-15",
    });
    expect(r.success).toBe(false);
  });

  it("accepts minor with tutor and empty student email", () => {
    const r = schema.safeParse({
      ...base,
      email: "",
      phone: "",
      birth_date: "2015-01-01",
      tutor_name: "María",
      tutor_dni: "999",
      tutor_email: "tutor@example.com",
      tutor_phone: "+54911",
      tutor_relationship: "Madre",
    });
    expect(r.success).toBe(true);
  });

  it("rejects future birth_date", () => {
    const r = schema.safeParse({
      ...base,
      birth_date: "2099-12-31",
    });
    expect(r.success).toBe(false);
  });

  it("rejects adult without phone", () => {
    const r = schema.safeParse({
      ...base,
      phone: "",
      birth_date: "2000-06-15",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "phone")).toBe(true);
    }
  });

  it("rejects minor without tutor fields", () => {
    const r = schema.safeParse({
      ...base,
      email: "",
      phone: "",
      birth_date: "2015-01-01",
    });
    expect(r.success).toBe(false);
  });

  it("accepts minor with tutor fields", () => {
    const r = schema.safeParse({
      ...base,
      email: "",
      phone: "",
      birth_date: "2015-01-01",
      tutor_name: "María",
      tutor_dni: "999",
      tutor_email: "tutor@example.com",
      tutor_phone: "+54911",
      tutor_relationship: "Madre",
    });
    expect(r.success).toBe(true);
  });

  it("rejects minor when student email field is supplied", () => {
    const r = schema.safeParse({
      ...base,
      email: "minor@school.test",
      phone: "",
      birth_date: "2015-01-01",
      tutor_name: "María",
      tutor_dni: "999",
      tutor_email: "tutor@example.com",
      tutor_phone: "+54911",
      tutor_relationship: "Madre",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some(
          (i) => i.message === "minor_student_email_disallowed",
        ),
      ).toBe(true);
    }
  });

  it("rejects minor when tutor DNI matches student DNI", () => {
    const r = schema.safeParse({
      ...base,
      email: "",
      phone: "",
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

  it("rejects minor when student phone field is supplied", () => {
    const r = schema.safeParse({
      ...base,
      email: "",
      phone: "+111",
      birth_date: "2015-01-01",
      tutor_name: "María",
      tutor_dni: "999",
      tutor_email: "tutor@example.com",
      tutor_phone: "+54911",
      tutor_relationship: "Madre",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some(
          (i) => i.message === "minor_student_phone_disallowed",
        ),
      ).toBe(true);
    }
  });

  it("rejects invalid section id", () => {
    const noSection = schema.safeParse({
      ...base,
      birth_date: "2000-06-15",
      preferred_section_id: "",
    });
    expect(noSection.success).toBe(false);
  });
});

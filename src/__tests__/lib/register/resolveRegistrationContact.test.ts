import { describe, expect, it } from "vitest";
import { resolveRegistrationContact } from "@/lib/register/resolveRegistrationContact";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

const base: AdminRegistrationRow = {
  id: "11111111-1111-1111-1111-111111111111",
  first_name: "Ana",
  last_name: "Perez",
  dni: "40111222",
  email: "ana@example.com",
  phone: null,
  birth_date: null,
  level_interest: null,
  status: "new",
  created_at: "2026-08-01T10:00:00.000Z",
  tutor_name: null,
  tutor_dni: null,
  tutor_email: null,
  tutor_phone: null,
  tutor_relationship: null,
  preferred_section_id: null,
  contacted_at: null,
  contacted_by: null,
  sourceSectionLinkId: null,
};

const opts = {
  legalAgeMajority: 18,
  country: "AR" as const,
  today: new Date("2026-08-07T12:00:00"),
};

describe("resolveRegistrationContact", () => {
  it("exposes the student phone for an adult", () => {
    const view = resolveRegistrationContact(
      { ...base, birth_date: "2000-01-01", phone: "+54 9 362 470-8145" },
      opts,
    );

    expect(view.isMinor).toBe(false);
    expect(view.student?.phoneDisplay).toBe("+54 9 362 470-8145");
    expect(view.student?.whatsAppDigits).toBe("5493624708145");
    expect(view.tutor).toBeNull();
  });

  it("exposes the tutor phone for a minor whose own phone is empty", () => {
    const view = resolveRegistrationContact(
      {
        ...base,
        birth_date: "2015-01-01",
        phone: null,
        tutor_name: "Marta Perez",
        tutor_phone: "+54 9 362 470-8145",
      },
      opts,
    );

    expect(view.isMinor).toBe(true);
    expect(view.student).toBeNull();
    expect(view.tutor?.label).toBe("Marta Perez");
    expect(view.tutor?.whatsAppDigits).toBe("5493624708145");
  });

  it("exposes both phones when the minor also has one", () => {
    const view = resolveRegistrationContact(
      {
        ...base,
        birth_date: "2015-01-01",
        phone: "+54 9 362 111-1111",
        tutor_phone: "+54 9 362 470-8145",
      },
      opts,
    );

    expect(view.student?.whatsAppDigits).toBe("5493621111111");
    expect(view.tutor?.whatsAppDigits).toBe("5493624708145");
  });

  it("keeps the display text but drops the WhatsApp action for an unusable number", () => {
    const view = resolveRegistrationContact(
      { ...base, birth_date: "2000-01-01", phone: "123" },
      opts,
    );

    expect(view.student?.phoneDisplay).toBe("123");
    expect(view.student?.whatsAppDigits).toBeNull();
  });

  it("returns no entries when nobody left a phone", () => {
    const view = resolveRegistrationContact({ ...base, birth_date: "2000-01-01" }, opts);

    expect(view.student).toBeNull();
    expect(view.tutor).toBeNull();
  });

  it("treats a missing birth date as adult so the student phone is not hidden", () => {
    const view = resolveRegistrationContact(
      { ...base, birth_date: null, phone: "+54 9 362 470-8145" },
      opts,
    );

    expect(view.isMinor).toBe(false);
    expect(view.student?.whatsAppDigits).toBe("5493624708145");
  });

  it("treats someone turning of age tomorrow as a minor", () => {
    const view = resolveRegistrationContact(
      { ...base, birth_date: "2008-08-08", tutor_phone: "+54 9 362 470-8145" },
      opts,
    );

    expect(view.isMinor).toBe(true);
  });
});

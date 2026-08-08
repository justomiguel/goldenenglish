import { describe, expect, it } from "vitest";
import type { CountryCode } from "libphonenumber-js";
import {
  buildAdminRetentionRows,
  type RawEnrollmentRow,
} from "@/lib/academics/buildAdminRetentionRows";

/**
 * Adult self-contact enrollment with a failing average, so it always qualifies
 * as a retention candidate and the phone resolution is what the test observes.
 */
function contextForSelfContactPhone(phone: string | null, instituteCountry: CountryCode | null) {
  const raw: RawEnrollmentRow[] = [
    {
      id: "e1",
      student_id: "s1",
      section_id: "sec1",
      status: "active",
      profiles: { first_name: "Ana", last_name: "Perez", is_minor: false, phone },
      academic_sections: { name: "A1" },
    },
  ];

  return {
    raw,
    avgMap: new Map([["e1", 4]]),
    countsByEnrollment: new Map<string, { wa: number; em: number }>(),
    tutorsByStudent: new Map<string, string[]>(),
    profileById: new Map<
      string,
      { label: string; phoneDigits: string | null; phoneDisplay: string | null }
    >(),
    attByEnrollment: new Map<string, never[]>(),
    emailByUserId: new Map<string, string | null>(),
    instituteCountry,
  };
}

describe("buildAdminRetentionRows phone normalization", () => {
  it("stores E.164 digits for a local number using the institute country", () => {
    const rows = buildAdminRetentionRows(contextForSelfContactPhone("0362 15 470-8145", "AR"));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.guardianPhoneDigits).toBe("5493624708145");
  });

  it("keeps an already-international number as the same digits", () => {
    const rows = buildAdminRetentionRows(
      contextForSelfContactPhone("+54 9 362 470-8145", "AR"),
    );

    expect(rows[0]?.guardianPhoneDigits).toBe("5493624708145");
  });

  it("drops the WhatsApp number when it cannot be resolved, instead of sending raw digits", () => {
    const rows = buildAdminRetentionRows(contextForSelfContactPhone("15 470-8145 int 22", null));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.guardianPhoneDigits).toBeNull();
  });

  it("still lists the candidate when there is no phone at all", () => {
    const rows = buildAdminRetentionRows(contextForSelfContactPhone(null, "AR"));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.guardianPhoneDigits).toBeNull();
    expect(rows[0]?.isSelfContact).toBe(true);
  });
});

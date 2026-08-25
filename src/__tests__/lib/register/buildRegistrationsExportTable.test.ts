import { describe, expect, it } from "vitest";
import { dictEn } from "@/test/dictEn";
import { buildRegistrationsExportTable } from "@/lib/register/buildRegistrationsExportTable";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

const labels = dictEn.admin.registrations;

const minor: AdminRegistrationRow = {
  id: "r1",
  first_name: "Ana",
  last_name: "Perez",
  dni: "40111222",
  email: "ana@example.com",
  phone: null,
  birth_date: "2015-03-04",
  level_interest: "A1",
  status: "contacted",
  created_at: "2026-08-01T10:00:00.000Z",
  tutor_name: "Marta Perez",
  tutor_dni: "20111222",
  tutor_email: "marta@example.com",
  tutor_phone: "+54 9 362 470-8145",
  tutor_relationship: "Madre",
  preferred_section_id: null,
  additionalSectionIds: [],
  existingStudentId: null,
  contacted_at: "2026-08-05T13:00:00.000Z",
  contacted_by: "admin-1",
  sourceSectionLinkId: null,
};

function build(rows: AdminRegistrationRow[]) {
  return buildRegistrationsExportTable(rows, labels, { locale: "en" });
}

describe("buildRegistrationsExportTable", () => {
  it("emits one row per registration plus a header row", () => {
    const table = build([minor]);

    expect(table.rows).toHaveLength(1);
    expect(table.headers.length).toBe(table.rows[0]?.length);
  });

  it("carries both phones so the export is as useful as the screen", () => {
    const table = build([minor]);
    const row = table.rows[0] ?? [];

    expect(row).toContain("+54 9 362 470-8145");
    expect(row).toContain("Marta Perez");
    expect(row).toContain("ana@example.com");
  });

  it("writes the empty marker instead of blank cells for missing data", () => {
    const table = build([{ ...minor, tutor_name: null, tutor_phone: null, phone: null }]);

    expect(table.rows[0]).toContain(labels.emptyValue);
  });

  it("uses the translated status label rather than the raw database value", () => {
    const table = build([minor]);

    expect(table.rows[0]).toContain(labels.contacted);
    expect(table.rows[0]).not.toContain("contacted");
  });

  it("keeps an unknown status readable instead of blanking the cell", () => {
    const table = build([{ ...minor, status: "legacy_import" }]);

    expect(table.rows[0]).toContain("legacy_import");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const assertAdmin = vi.fn();
const loadPaginatedRegistrations = vi.fn();
const recordSystemAudit = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/dashboard/assertAdmin", () => ({ assertAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/dashboard/loadPaginatedRegistrations", () => ({ loadPaginatedRegistrations }));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit }));

const { exportRegistrationsAction } = await import(
  "@/app/[locale]/dashboard/admin/registrations/exportRegistrationsAction"
);

const row = {
  id: "r1",
  first_name: "Ana",
  last_name: "Perez",
  dni: "40111222",
  email: "ana@example.com",
  phone: "+54 9 362 470-8145",
  birth_date: "2015-03-04",
  level_interest: "A1",
  status: "new",
  created_at: "2026-08-01T10:00:00.000Z",
  tutor_name: "Marta Perez",
  tutor_dni: "20111222",
  tutor_email: "marta@example.com",
  tutor_phone: "+54 9 362 470-8146",
  tutor_relationship: "Madre",
  preferred_section_id: null,
  contacted_at: null,
  contacted_by: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  assertAdmin.mockResolvedValue({ user: { id: "admin-1" } });
  loadPaginatedRegistrations.mockResolvedValue({ rows: [row], totalCount: 1, page: 1, pageSize: 2000 });
});

describe("exportRegistrationsAction", () => {
  it("refuses a non-admin caller", async () => {
    assertAdmin.mockRejectedValueOnce(new Error("nope"));

    const res = await exportRegistrationsAction({ locale: "es" });

    expect(res.ok).toBe(false);
    expect(loadPaginatedRegistrations).not.toHaveBeenCalled();
  });

  it("returns a spreadsheet artifact for an admin", async () => {
    const res = await exportRegistrationsAction({ locale: "es" });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.artifact.filename).toMatch(/^inscripciones_\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(res.artifact.base64.length).toBeGreaterThan(0);
  });

  it("exports the same rows the admin is looking at, filters included", async () => {
    await exportRegistrationsAction({ locale: "es", q: "ana", status: "contacted" });

    expect(loadPaginatedRegistrations).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ q: "ana", status: "contacted" }),
    );
  });

  it("records the export in the audit trail", async () => {
    await exportRegistrationsAction({ locale: "es", status: "new" });

    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "registrations_spreadsheet_export",
        payload: expect.objectContaining({ rowCount: 1, status: "new" }),
      }),
    );
  });

  it("rejects an unknown status instead of exporting everything", async () => {
    const res = await exportRegistrationsAction({
      locale: "es",
      status: "enrolled" as unknown as "new",
    });

    expect(res.ok).toBe(false);
    expect(loadPaginatedRegistrations).not.toHaveBeenCalled();
  });

  it("reports a failure instead of throwing when the load blows up", async () => {
    loadPaginatedRegistrations.mockRejectedValueOnce(new Error("db down"));

    const res = await exportRegistrationsAction({ locale: "es" });

    expect(res.ok).toBe(false);
  });
});

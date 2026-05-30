import { describe, expect, it } from "vitest";
import { buildEventAttendeesExportTable } from "@/lib/events/export/buildEventAttendeesExportTable";
import type { EventAttendeeRow } from "@/lib/dashboard/events/loadEventAttendeesPaginated";

const labels = {
  name: "Name",
  dni: "ID",
  email: "Email",
  phone: "Phone",
  birthDate: "Birth date",
  status: "Status",
  payment: "Payment",
  residency: "Residency",
  source: "Source",
  registered: "Registered",
  tutorName: "Tutor name",
  tutorDni: "Tutor ID",
  tutorEmail: "Tutor email",
  tutorPhone: "Tutor phone",
  tutorRelationship: "Relationship",
  statusLabels: { confirmed: "Confirmed" },
  paymentLabels: { approved: "Approved" },
  residencyLabels: { local: "Local", nonLocal: "Non-local" },
  sourceLabels: { public: "Public" },
  noPhone: "No phone",
  noBirthDate: "No birth date",
  noPayment: "No payment",
  emptyValue: "—",
};

const attendee: EventAttendeeRow = {
  id: "att-1",
  eventId: "evt-1",
  firstName: "Ana",
  lastName: "García",
  dniOrPassport: "123",
  email: "ana@example.com",
  phone: "+56911111111",
  birthDate: "2010-05-01",
  status: "confirmed",
  source: "public",
  isLocalResident: true,
  userId: null,
  tutorId: null,
  tutor: {
    firstName: "Luis",
    lastName: "García",
    dniOrPassport: "456",
    email: "luis@example.com",
    phone: "",
    relationship: "Father",
  },
  payment: { status: "approved", amount: 10000, currency: "CLP", gatewayProvider: null },
  createdAt: "2026-05-01T12:00:00.000Z",
};

describe("buildEventAttendeesExportTable", () => {
  it("includes fixed and custom columns in header order", () => {
    const table = buildEventAttendeesExportTable({
      attendees: [attendee],
      customColumns: [{ fieldKey: "school", label: "School" }],
      customFieldValues: {
        "att-1": [{ fieldKey: "school", label: "School", displayValue: "Colegio Norte" }],
      },
      locale: "es-CL",
      labels,
    });

    expect(table.headers.at(-1)).toBe("School");
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0]?.[0]).toContain("García");
    expect(table.rows[0]?.at(-1)).toBe("Colegio Norte");
  });

  it("fills empty custom values with emptyValue label", () => {
    const table = buildEventAttendeesExportTable({
      attendees: [attendee],
      customColumns: [{ fieldKey: "school", label: "School" }],
      customFieldValues: {},
      locale: "en-US",
      labels,
    });

    expect(table.rows[0]?.at(-1)).toBe("—");
  });
});

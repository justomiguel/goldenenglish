import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dictEn } from "@/test/dictEn";
import { AdminRegistrationExpandedDetails } from "@/components/dashboard/AdminRegistrationExpandedDetails";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

const labels = dictEn.admin.registrations;

const row: AdminRegistrationRow = {
  id: "r1",
  first_name: "Ana",
  last_name: "Perez",
  dni: "40111222",
  email: "ana@example.com",
  phone: null,
  birth_date: "2015-03-04",
  level_interest: null,
  status: "contacted",
  created_at: "2026-08-01T10:00:00.000Z",
  tutor_name: "Marta Perez",
  tutor_dni: "20111222",
  tutor_email: "marta@example.com",
  tutor_phone: "+54 9 362 470-8145",
  tutor_relationship: "Madre",
  preferred_section_id: "sec-1",
  additionalSectionIds: [],
  existingStudentId: null,
  contacted_at: "2026-08-05T13:00:00.000Z",
  contacted_by: "admin-1",
  sourceSectionLinkId: null,
};

function renderInTable(ui: ReactNode) {
  return render(
    <table>
      <tbody>{ui}</tbody>
    </table>,
  );
}

describe("AdminRegistrationExpandedDetails", () => {
  it("shows the email that no longer has its own column", () => {
    renderInTable(
      <AdminRegistrationExpandedDetails
        row={row}
        colSpan={9}
        locale="en"
        labels={labels}
        sectionName="Morning A1"
      />,
    );

    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });

  it("shows the full guardian block", () => {
    renderInTable(
      <AdminRegistrationExpandedDetails
        row={row}
        colSpan={9}
        locale="en"
        labels={labels}
        sectionName={null}
      />,
    );

    expect(screen.getByText("Marta Perez")).toBeInTheDocument();
    expect(screen.getByText("marta@example.com")).toBeInTheDocument();
    expect(screen.getByText("20111222")).toBeInTheDocument();
    expect(screen.getByText("Madre")).toBeInTheDocument();
  });

  it("shows the preferred group when the section is known", () => {
    renderInTable(
      <AdminRegistrationExpandedDetails
        row={row}
        colSpan={9}
        locale="en"
        labels={labels}
        sectionName="Morning A1"
      />,
    );

    expect(screen.getByText("Morning A1")).toBeInTheDocument();
  });

  it("falls back to the empty marker for fields the family left blank", () => {
    renderInTable(
      <AdminRegistrationExpandedDetails
        row={{ ...row, tutor_name: null, tutor_email: null }}
        colSpan={9}
        locale="en"
        labels={labels}
        sectionName={null}
      />,
    );

    expect(screen.getAllByText(labels.emptyValue).length).toBeGreaterThan(0);
  });

  it("spans the whole table width so the panel is not squeezed into one column", () => {
    const { container } = renderInTable(
      <AdminRegistrationExpandedDetails
        row={row}
        colSpan={9}
        locale="en"
        labels={labels}
        sectionName={null}
      />,
    );

    expect(container.querySelector("td")).toHaveAttribute("colspan", "9");
  });
});

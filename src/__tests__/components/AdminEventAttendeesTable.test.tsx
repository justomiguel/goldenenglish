import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { AdminEventAttendeesTable } from "@/components/dashboard/admin/events/AdminEventAttendeesTable";
import type { AdminEventAttendeesPanelLabels } from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";
import type { EventAttendeeRow } from "@/lib/dashboard/events/loadEventAttendeesPaginated";

const detail = dictEn.admin.events.detail;

const labels: AdminEventAttendeesPanelLabels = {
  title: detail.attendeesTitle,
  empty: detail.attendeesEmpty,
  searchPlaceholder: detail.attendeesSearchPlaceholder,
  searchButton: detail.attendeesSearchButton,
  expandRow: detail.attendeesExpandRow,
  collapseRow: detail.attendeesCollapseRow,
  moreDetails: detail.attendeesMoreDetails,
  columns: detail.attendeesColumns,
  statusLabels: detail.attendeesStatusLabels,
  paymentLabels: {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  },
  residencyLabels: detail.attendeesResidencyLabels,
  sourceLabels: detail.attendeesSourceLabels,
  tutorSectionTitle: detail.attendeesTutorSectionTitle,
  customFieldsTitle: detail.attendeesCustomFieldsTitle,
  noPhone: detail.attendeesNoPhone,
  noBirthDate: detail.attendeesNoBirthDate,
  noPayment: detail.attendeesNoPayment,
  pagination: {
    prev: "Prev",
    next: "Next",
    summary: "Page {{page}}",
    pageOf: detail.attendeesPaginationPageOf,
    navAria: detail.attendeesPaginationNav,
  },
  export: {
    downloadXlsx: detail.attendeesExport.downloadXlsx,
    downloadPdf: detail.attendeesExport.downloadPdf,
    tipXlsx: detail.attendeesExport.tipXlsx,
    tipPdf: detail.attendeesExport.tipPdf,
    exportError: detail.attendeesExport.exportError,
  },
  delete: {
    delete: detail.attendeesDelete,
    deleteTooltip: detail.attendeesDeleteTooltip,
    deleteConfirmTitle: detail.attendeesDeleteConfirmTitle,
    deleteConfirmBody: detail.attendeesDeleteConfirmBody,
    deleteConfirm: detail.attendeesDeleteConfirm,
    cancel: detail.attendeesDeleteCancel,
    errorDelete: detail.attendeesErrorDelete,
    errorNotDeletable: detail.attendeesErrorNotDeletable,
  },
};

const row: EventAttendeeRow = {
  id: "attendee-1",
  firstName: "Ana",
  lastName: "García",
  dniOrPassport: "12345678",
  email: "ana@example.com",
  phone: "+5491112345678",
  status: "confirmed",
  residency: "local",
  source: "public",
  birthDate: null,
  registeredAt: "2026-06-01T10:00:00.000Z",
  payment: {
    id: "pay-1",
    status: "approved",
    amountCents: 10000,
    currency: "ARS",
    method: "bank_transfer",
  },
  tutorFirstName: null,
  tutorLastName: null,
  tutorEmail: null,
  tutorPhone: null,
  userId: null,
};

describe("AdminEventAttendeesTable", () => {
  it("expands attendee details when More details is clicked", async () => {
    const user = userEvent.setup();

    render(
      <AdminEventAttendeesTable
        locale="en"
        eventId="event-1"
        rows={[row]}
        customFieldValues={{}}
        labels={labels}
      />,
    );

    expect(screen.queryByTestId("attendee-expanded-attendee-1")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: detail.attendeesExpandRow }));

    expect(screen.getByTestId("attendee-expanded-attendee-1")).toBeInTheDocument();
  });
});

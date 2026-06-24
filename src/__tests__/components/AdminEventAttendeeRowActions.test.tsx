import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { AdminEventAttendeeRowActions } from "@/components/dashboard/admin/events/AdminEventAttendeeRowActions";
import type { AdminEventAttendeesPanelLabels } from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";

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

vi.mock("@/app/[locale]/dashboard/admin/events/actions", () => ({
  deleteEventAttendeeAction: vi.fn(),
}));

describe("AdminEventAttendeeRowActions", () => {
  it("shows labeled detail control and toggles expansion", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <AdminEventAttendeeRowActions
        locale="en"
        eventId="event-1"
        attendeeId="attendee-1"
        expanded={false}
        deletable={false}
        labels={labels}
        onToggle={onToggle}
      />,
    );

    const detailsButton = screen.getByRole("button", { name: detail.attendeesExpandRow });
    expect(detailsButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(detail.attendeesMoreDetails)).toBeVisible();

    await user.click(detailsButton);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("shows delete action with visible label when deletable", () => {
    render(
      <AdminEventAttendeeRowActions
        locale="en"
        eventId="event-1"
        attendeeId="attendee-1"
        expanded={false}
        deletable
        labels={labels}
        onToggle={vi.fn()}
      />,
    );

    const deleteButton = screen.getByRole("button", { name: detail.attendeesDeleteTooltip });
    expect(deleteButton).toBeVisible();
    expect(deleteButton).toHaveTextContent(detail.attendeesDelete);
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { AdminEventPaymentReviewActions } from "@/components/dashboard/admin/events/AdminEventPaymentReviewActions";

const detail = dictEn.admin.events.detail;
const payments = dictEn.admin.payments;

const labels = {
  actionsTitle: detail.attendeesColumns.actions,
  notes: payments.notes,
  notesTooltip: payments.notesTooltip,
  approve: payments.approve,
  reject: payments.reject,
  delete: detail.paymentsDelete,
  approveTooltip: payments.approveTooltip,
  rejectTooltip: payments.rejectTooltip,
  deleteTooltip: detail.paymentsDeleteTooltip,
  deleteConfirmTitle: detail.paymentsDeleteConfirmTitle,
  deleteConfirmBody: detail.paymentsDeleteConfirmBody,
  deleteConfirm: detail.paymentsDeleteConfirm,
  cancel: detail.paymentsDeleteCancel,
  errorSave: detail.paymentsErrorSave,
  errorDelete: detail.paymentsErrorDelete,
  revert: detail.paymentsRevert,
  revertTooltip: detail.paymentsRevertTooltip,
  revertConfirmTitle: detail.paymentsRevertConfirmTitle,
  revertConfirmBody: detail.paymentsRevertConfirmBody,
  revertConfirm: detail.paymentsRevertConfirm,
  errorNotRevertible: detail.paymentsErrorNotRevertible,
};

vi.mock("@/app/[locale]/dashboard/admin/events/actions", () => ({
  approveEventPaymentAction: vi.fn(),
  rejectEventPaymentAction: vi.fn(),
  deleteEventPaymentAction: vi.fn(),
  revertEventPaymentApprovalAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/events/event-1",
}));

describe("AdminEventPaymentReviewActions", () => {
  it("renders labeled approve and reject controls for pending payments", () => {
    render(
      <AdminEventPaymentReviewActions
        locale="en"
        eventId="event-1"
        paymentId="payment-1"
        status="pending"
        gatewayProvider={null}
        initialNotes=""
        labels={labels}
      />,
    );

    expect(screen.getByRole("region", { name: detail.attendeesColumns.actions })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: detail.attendeesColumns.actions })).toBeVisible();

    const approveButton = screen.getByRole("button", { name: payments.approveTooltip });
    expect(approveButton).toHaveTextContent(payments.approve);

    const rejectButton = screen.getByRole("button", { name: payments.rejectTooltip });
    expect(rejectButton).toHaveTextContent(payments.reject);
  });

  it("shows delete action with visible label for rejected bank transfers", async () => {
    const user = userEvent.setup();

    render(
      <AdminEventPaymentReviewActions
        locale="en"
        eventId="event-1"
        paymentId="payment-1"
        status="rejected"
        gatewayProvider={null}
        initialNotes="Mismatch"
        labels={labels}
      />,
    );

    const deleteButton = screen.getByRole("button", { name: detail.paymentsDeleteTooltip });
    expect(deleteButton).toHaveTextContent(detail.paymentsDelete);

    await user.click(deleteButton);
    expect(screen.getByRole("heading", { name: detail.paymentsDeleteConfirmTitle })).toBeVisible();
  });

  it("renders nothing when payment is approved via gateway", () => {
    const { container } = render(
      <AdminEventPaymentReviewActions
        locale="en"
        eventId="event-1"
        paymentId="payment-1"
        status="approved"
        gatewayProvider="mercadopago"
        initialNotes=""
        labels={labels}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows revert action for manually approved bank transfers", async () => {
    const user = userEvent.setup();

    render(
      <AdminEventPaymentReviewActions
        locale="en"
        eventId="event-1"
        paymentId="payment-1"
        status="approved"
        gatewayProvider={null}
        initialNotes="Verified"
        labels={labels}
      />,
    );

    const revertButton = screen.getByRole("button", { name: detail.paymentsRevertTooltip });
    expect(revertButton).toHaveTextContent(detail.paymentsRevert);

    await user.click(revertButton);
    expect(screen.getByRole("heading", { name: detail.paymentsRevertConfirmTitle })).toBeVisible();
  });
});

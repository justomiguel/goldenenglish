import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminRegistrationRecordPayment } from "@/components/dashboard/AdminRegistrationRecordPayment";
import dict from "@/dictionaries/en.json";

vi.mock("@/app/[locale]/dashboard/admin/registrations/recordRegistrationFeePaymentAction", () => ({
  recordRegistrationFeePaymentAction: vi.fn(),
}));

const labels = dict.admin.registrations.intake;

describe("AdminRegistrationRecordPayment", () => {
  it("defaults to cash and blocks a zero amount", () => {
    render(
      <AdminRegistrationRecordPayment
        locale="en"
        registrationId="reg-1"
        defaultAmount={15000}
        labels={labels}
        busy={false}
        joinDisposition={{ kind: "behind" }}
        onRequireDisposition={() => ({ kind: "behind" })}
        onRun={() => undefined}
      />,
    );
    expect(screen.getByLabelText(labels.paymentMethodLabel)).toHaveValue("cash");
    expect(screen.getByRole("button", { name: labels.recordPayment })).toBeEnabled();

    fireEvent.change(screen.getByLabelText(labels.recordPaymentAmount), { target: { value: "0" } });
    expect(screen.getByRole("alert")).toHaveTextContent(labels.recordPaymentAmountInvalid);
    expect(screen.getByRole("button", { name: labels.recordPayment })).toBeDisabled();
  });
});

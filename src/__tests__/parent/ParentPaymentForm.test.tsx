import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { ParentPaymentForm } from "@/components/parent/ParentPaymentForm";

const submitParentPaymentReceiptMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/[locale]/dashboard/parent/payments/actions", () => ({
  submitParentPaymentReceipt: submitParentPaymentReceiptMock,
}));

function submitParentFormWithFile(receiptInput: HTMLElement, file: File) {
  const input = receiptInput as HTMLInputElement;
  const form = input.form;
  if (!form) throw new Error("expected file input in form");
  fireEvent.change(input, { target: { files: [file] } });
  form.noValidate = true;
  fireEvent.click(
    screen.getByRole("button", { name: dictEn.dashboard.parent.submit }),
  );
}

describe("ParentPaymentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submitParentPaymentReceiptMock.mockResolvedValue({ ok: true });
  });

  it("submits and shows error message from action", async () => {
    submitParentPaymentReceiptMock.mockResolvedValueOnce({
      ok: false,
      message: "bad",
    });
    render(
      <ParentPaymentForm
        options={[{ id: "stu-1", label: "Kid" }]}
        labels={dictEn.dashboard.parent}
      />,
    );
    fireEvent.change(screen.getByLabelText(dictEn.dashboard.parent.amount), {
      target: { value: "10" },
    });
    submitParentFormWithFile(
      screen.getByLabelText(dictEn.dashboard.parent.receipt),
      new File([new Uint8Array([1])], "r.pdf", { type: "application/pdf" }),
    );
    await waitFor(() => {
      expect(submitParentPaymentReceiptMock).toHaveBeenCalled();
      expect(
        screen.getByText(`${dictEn.dashboard.parent.error}: bad`),
      ).toBeInTheDocument();
    });
  });

  it("shows success when action succeeds", async () => {
    submitParentPaymentReceiptMock.mockResolvedValueOnce({ ok: true });
    render(
      <ParentPaymentForm
        options={[{ id: "stu-1", label: "Kid" }]}
        labels={dictEn.dashboard.parent}
      />,
    );
    fireEvent.change(screen.getByLabelText(dictEn.dashboard.parent.amount), {
      target: { value: "25" },
    });
    submitParentFormWithFile(
      screen.getByLabelText(dictEn.dashboard.parent.receipt),
      new File([new Uint8Array([1])], "r.pdf", { type: "application/pdf" }),
    );
    await waitFor(() => {
      expect(submitParentPaymentReceiptMock).toHaveBeenCalled();
      expect(screen.getByText(dictEn.dashboard.parent.success)).toBeInTheDocument();
    });
  });

  it("returns null without options", () => {
    const { container } = render(
      <ParentPaymentForm options={[]} labels={dictEn.dashboard.parent} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

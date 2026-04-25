import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudentEnrollmentFeeUpload } from "@/components/molecules/StudentEnrollmentFeeUpload";
import dictEn from "@/dictionaries/en.json";

const labels = dictEn.dashboard.student.monthly;

const baseProps = {
  locale: "es",
  studentId: "student-1",
  sectionId: "section-1",
  enrollmentId: "enroll-1",
  labels,
  onSubmitted: vi.fn(),
};

describe("StudentEnrollmentFeeUpload", () => {
  it("shows upload form when no receipt has been submitted", () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(
      <StudentEnrollmentFeeUpload
        {...baseProps}
        receiptStatus={null}
        receiptSignedUrl={null}
        submitAction={action}
      />,
    );
    expect(screen.getByText(labels.enrollmentFeeUploadTitle)).toBeTruthy();
    expect(screen.getByText(labels.enrollmentFeeUploadBtn)).toBeTruthy();
  });

  it("shows 'under review' message when status is pending", () => {
    const action = vi.fn();
    render(
      <StudentEnrollmentFeeUpload
        {...baseProps}
        receiptStatus="pending"
        receiptSignedUrl={null}
        submitAction={action}
      />,
    );
    expect(screen.getByText(labels.enrollmentFeeReceiptPending)).toBeTruthy();
  });

  it("shows approved message and hides upload when approved", () => {
    const action = vi.fn();
    render(
      <StudentEnrollmentFeeUpload
        {...baseProps}
        receiptStatus="approved"
        receiptSignedUrl="https://example.com/receipt.jpg"
        submitAction={action}
      />,
    );
    expect(screen.getByText(labels.enrollmentFeeReceiptApproved)).toBeTruthy();
    expect(screen.queryByText(labels.enrollmentFeeUploadBtn)).toBeNull();
  });

  it("shows rejected message and re-upload button when rejected", () => {
    const action = vi.fn();
    render(
      <StudentEnrollmentFeeUpload
        {...baseProps}
        receiptStatus="rejected"
        receiptSignedUrl={null}
        submitAction={action}
      />,
    );
    expect(screen.getByText(labels.enrollmentFeeReceiptRejected)).toBeTruthy();
    expect(screen.getByText(labels.enrollmentFeeReuploadBtn)).toBeTruthy();
  });

  it("shows view receipt link when signed url is present and pending", () => {
    const action = vi.fn();
    render(
      <StudentEnrollmentFeeUpload
        {...baseProps}
        receiptStatus="pending"
        receiptSignedUrl="https://example.com/receipt.jpg"
        submitAction={action}
      />,
    );
    const link = screen.getByText(labels.enrollmentFeeReceiptView);
    expect(link.closest("a")).toBeTruthy();
  });

  it("calls submit action with correct formData fields on submit", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(
      <StudentEnrollmentFeeUpload
        {...baseProps}
        receiptStatus={null}
        receiptSignedUrl={null}
        submitAction={action}
      />,
    );

    const file = new File(["data"], "receipt.jpg", { type: "image/jpeg" });
    const input = screen.getByRole("button", { name: new RegExp(labels.enrollmentFeeUploadBtn) })
      .closest("form")
      ?.querySelector("input[type='file']") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.submit(input.closest("form")!);

    await vi.waitFor(() => {
      expect(action).toHaveBeenCalledOnce();
      const fd: FormData = action.mock.calls[0][0];
      expect(fd.get("sectionId")).toBe("section-1");
      expect(fd.get("studentId")).toBe("student-1");
      expect(fd.get("enrollmentId")).toBe("enroll-1");
      expect(fd.get("receipt")).toBeInstanceOf(File);
    });
  });

  it("shows error message when action returns an error", async () => {
    const action = vi.fn().mockResolvedValue({ ok: false, message: "Upload failed." });
    render(
      <StudentEnrollmentFeeUpload
        {...baseProps}
        receiptStatus={null}
        receiptSignedUrl={null}
        submitAction={action}
      />,
    );

    const file = new File(["data"], "r.jpg", { type: "image/jpeg" });
    const form = screen.getByRole("button", { name: new RegExp(labels.enrollmentFeeUploadBtn) })
      .closest("form")!;
    const input = form.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.submit(form);

    await vi.waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("Upload failed.");
    });
  });
});

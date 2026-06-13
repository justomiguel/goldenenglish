import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReceiptAutoUploadField } from "@/components/molecules/ReceiptAutoUploadField";
import { dictEn } from "@/test/dictEn";

const fileUploadProgress = dictEn.common.fileUpload;
const studentLabels = dictEn.dashboard.student;

describe("ReceiptAutoUploadField", () => {
  it("uploads immediately when uploadFlow is immediate (default)", async () => {
    const onFileSelected = vi.fn().mockResolvedValue(undefined);
    render(
      <ReceiptAutoUploadField
        buttonLabel={studentLabels.paySubmit}
        fileUploadProgress={fileUploadProgress}
        onFileSelected={onFileSelected}
      />,
    );

    const file = new File(["pdf"], "receipt.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onFileSelected).toHaveBeenCalledWith(file));
  });

  it("confirm flow: choose file then submit sends on second button only", async () => {
    const onFileSelected = vi.fn().mockResolvedValue(undefined);
    render(
      <ReceiptAutoUploadField
        uploadFlow="confirm"
        chooseButtonLabel={studentLabels.payReceiptChooseButton}
        buttonLabel={studentLabels.paySubmit}
        noFileSelectedLabel={studentLabels.payReceiptNoFileSelected}
        fileUploadProgress={fileUploadProgress}
        onFileSelected={onFileSelected}
      />,
    );

    const chooseBtn = screen.getByRole("button", { name: studentLabels.payReceiptChooseButton });
    const submitBtn = screen.getByRole("button", { name: studentLabels.paySubmit });
    expect(submitBtn).toBeDisabled();

    const file = new File(["img"], "proof.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFileSelected).not.toHaveBeenCalled();
    expect(screen.getByText("proof.jpg")).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    await waitFor(() => expect(onFileSelected).toHaveBeenCalledWith(file));
  });
});

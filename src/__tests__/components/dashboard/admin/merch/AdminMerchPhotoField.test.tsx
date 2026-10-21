import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminMerchPhotoField } from "@/components/dashboard/admin/merch/AdminMerchPhotoField";
import en from "@/dictionaries/en.json";

const performShopMediaFileUpload = vi.hoisted(() => vi.fn());

vi.mock("@/components/dashboard/admin/merch/performShopMediaFileUpload", () => ({
  performShopMediaFileUpload: (...args: unknown[]) => performShopMediaFileUpload(...args),
}));

describe("AdminMerchPhotoField upload progress", () => {
  it("shows the upload modal while the photo is in flight", async () => {
    let resolveUpload: (value: { storagePath: string } | null) => void = () => undefined;
    performShopMediaFileUpload.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
    );
    const user = userEvent.setup();
    const { container } = render(
      <AdminMerchPhotoField
        productId="prod-1"
        imageUrl={null}
        labels={en.admin.merch}
        fileUploadProgress={en.common.fileUpload}
        onUploaded={async () => undefined}
      />,
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array(4)], "hoodie.png", { type: "image/png" });
    await user.upload(input, file);

    expect(await screen.findByText(en.common.fileUpload.modalTitle)).toBeInTheDocument();
    expect(screen.getByText("hoodie.png")).toBeInTheDocument();

    resolveUpload({ storagePath: "products/prod-1/hoodie.png" });
    await waitFor(() => {
      expect(screen.queryByText(en.common.fileUpload.modalTitle)).not.toBeInTheDocument();
    });
  });
});

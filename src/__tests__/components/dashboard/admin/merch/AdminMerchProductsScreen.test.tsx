import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { upsertShopVariant } from "@/app/[locale]/dashboard/admin/merch/actions";
import { AdminMerchProductsScreen } from "@/components/dashboard/admin/merch/AdminMerchProductsScreen";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/merch",
}));

vi.mock("@/app/[locale]/dashboard/admin/merch/actions", () => ({
  createShopProduct: vi.fn(),
  updateShopProduct: vi.fn(),
  toggleShopProductActive: vi.fn(),
  upsertShopVariant: vi.fn(),
  deleteShopVariant: vi.fn(),
  archiveShopVariant: vi.fn(),
}));

const PRODUCT_ID = "00000000-0000-4000-8000-000000000001";
const VARIANT_ID = "00000000-0000-4000-8000-000000000002";

const hoodieRow = {
  id: PRODUCT_ID,
  title: "Hoodie",
  description: "",
  imageUrl: null,
  imagePath: null,
  active: false,
  sortOrder: 0,
  variants: [
    {
      id: VARIANT_ID,
      size: "M",
      color: "Navy",
      sku: "HOODIE-M-NAVY",
      stock: 4,
      price: 19.9,
      active: true,
    },
  ],
};

describe("AdminMerchProductsScreen", () => {
  it("renders the catalog header and empty state", () => {
    render(
      <AdminMerchProductsScreen locale="en" initialRows={[]} labels={dictEn.admin.merch} />,
    );
    expect(screen.getByRole("heading", { name: dictEn.admin.merch.title })).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.merch.none)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dictEn.admin.merch.createSubmit })).toBeInTheDocument();
  });

  // REGRESSION CHECK: existing-row save must send id so upsert updates, not inserts.
  it("sends upsert with variant id when saving an existing row", async () => {
    vi.mocked(upsertShopVariant).mockResolvedValue({ ok: true, id: VARIANT_ID });
    const user = userEvent.setup();
    render(
      <AdminMerchProductsScreen locale="en" initialRows={[hoodieRow]} labels={dictEn.admin.merch} />,
    );
    await user.click(screen.getByRole("button", { name: dictEn.admin.merch.editCta }));
    const row = screen.getByText(/HOODIE-M-NAVY/).closest("li");
    expect(row).toBeTruthy();
    const stock = within(row as HTMLElement).getByLabelText(dictEn.admin.merch.variantStock);
    await user.clear(stock);
    await user.type(stock, "8");
    await user.click(
      within(row as HTMLElement).getByRole("button", { name: dictEn.admin.merch.variantSave }),
    );
    expect(upsertShopVariant).toHaveBeenCalledWith(
      expect.objectContaining({
        id: VARIANT_ID,
        productId: PRODUCT_ID,
        size: "M",
        color: "Navy",
        sku: "HOODIE-M-NAVY",
        stock: 8,
        price: 19.9,
        active: true,
      }),
    );
  });

  it("restores an archived variant with id and active true when the pair is unique", async () => {
    vi.mocked(upsertShopVariant).mockResolvedValue({ ok: true, id: VARIANT_ID });
    const user = userEvent.setup();
    render(
      <AdminMerchProductsScreen
        locale="en"
        initialRows={[
          {
            ...hoodieRow,
            variants: [{ ...hoodieRow.variants[0], active: false }],
          },
        ]}
        labels={dictEn.admin.merch}
      />,
    );
    await user.click(screen.getByRole("button", { name: dictEn.admin.merch.editCta }));
    const row = screen.getByText(/HOODIE-M-NAVY/).closest("li");
    expect(row).toBeTruthy();
    await user.click(
      within(row as HTMLElement).getByRole("button", { name: dictEn.admin.merch.variantRestore }),
    );
    expect(upsertShopVariant).toHaveBeenCalledWith(
      expect.objectContaining({
        id: VARIANT_ID,
        productId: PRODUCT_ID,
        active: true,
      }),
    );
  });

  it("uses distinct field ids for create and edit product forms", async () => {
    const user = userEvent.setup();
    render(
      <AdminMerchProductsScreen locale="en" initialRows={[hoodieRow]} labels={dictEn.admin.merch} />,
    );
    await user.click(screen.getByRole("button", { name: dictEn.admin.merch.editCta }));
    expect(document.getElementById("create-merch-title")).toBeTruthy();
    expect(document.getElementById("edit-merch-title")).toBeTruthy();
    expect(document.getElementById("merch-title")).toBeNull();
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminMerchProductsScreen } from "@/components/dashboard/admin/merch/AdminMerchProductsScreen";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/merch/actions", () => ({
  createShopProduct: vi.fn(),
  updateShopProduct: vi.fn(),
  toggleShopProductActive: vi.fn(),
  upsertShopVariant: vi.fn(),
  deleteShopVariant: vi.fn(),
  archiveShopVariant: vi.fn(),
}));

describe("AdminMerchProductsScreen", () => {
  it("renders the catalog header and empty state", () => {
    render(
      <AdminMerchProductsScreen locale="en" initialRows={[]} labels={dictEn.admin.merch} />,
    );
    expect(screen.getByRole("heading", { name: dictEn.admin.merch.title })).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.merch.none)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dictEn.admin.merch.createSubmit })).toBeInTheDocument();
  });
});

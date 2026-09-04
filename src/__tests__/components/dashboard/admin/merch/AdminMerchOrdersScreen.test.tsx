import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  assignAdminShopOrder,
  transitionAdminShopOrder,
} from "@/app/[locale]/dashboard/admin/merch/orders/actions";
import { AdminMerchOrdersScreen } from "@/components/dashboard/admin/merch/AdminMerchOrdersScreen";
import type { AdminShopOrderRow } from "@/lib/shop/loadAdminShopOrders";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/merch/orders",
}));

vi.mock("@/app/[locale]/dashboard/admin/merch/orders/actions", () => ({
  assignAdminShopOrder: vi.fn(),
  transitionAdminShopOrder: vi.fn(),
}));

const ORDER_ID = "00000000-0000-4000-8000-000000000011";
const labels = dictEn.admin.merch;
const statusLabels = dictEn.shop.order.status;

const paidRow: AdminShopOrderRow = {
  id: ORDER_ID,
  status: "paid",
  currency: "CLP",
  total: 19990,
  buyerEmail: "ada@school.cl",
  assigneeStudentId: null,
  assigneeName: "",
  items: "Hoodie M/Navy ×1",
};

function renderOrders(row: AdminShopOrderRow = paidRow) {
  return render(
    <AdminMerchOrdersScreen
      locale="en"
      statusFilter="all"
      rows={[row]}
      students={[{ id: "00000000-0000-4000-8000-000000000022", label: "Ada" }]}
      labels={labels}
      statusLabels={statusLabels}
    />,
  );
}

describe("AdminMerchOrdersScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens ConfirmActionModal for cancel and only writes after confirm", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    vi.mocked(transitionAdminShopOrder).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderOrders();

    await user.click(screen.getByRole("button", { name: labels.markCancel }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(transitionAdminShopOrder).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(labels.cancelConfirm)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: labels.markCancel }));
    expect(transitionAdminShopOrder).toHaveBeenCalledWith({
      locale: "en",
      orderId: ORDER_ID,
      to: "cancelled",
    });
    confirmSpy.mockRestore();
  });

  it("does not cancel when the confirm modal is dismissed", async () => {
    vi.mocked(transitionAdminShopOrder).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderOrders();

    await user.click(screen.getByRole("button", { name: labels.markCancel }));
    const dialog = screen.getByRole("dialog");
    const dismiss = within(dialog).getAllByRole("button", {
      name: labels.modalCancel,
      exact: true,
    });
    await user.click(dismiss[dismiss.length - 1]);

    expect(transitionAdminShopOrder).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("marks ready without a confirm dialog", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    vi.mocked(transitionAdminShopOrder).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderOrders();

    await user.click(screen.getByRole("button", { name: labels.markReady }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(transitionAdminShopOrder).toHaveBeenCalledWith({
      locale: "en",
      orderId: ORDER_ID,
      to: "ready_for_pickup",
    });
    confirmSpy.mockRestore();
  });
});

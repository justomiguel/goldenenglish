import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShopOrderStatus } from "@/components/shop/ShopOrderStatus";

const labels = {
  title: "Your order",
  pickup: "Pickup at the institute.",
  items: "Items",
  total: "Total",
  quantity: "Quantity",
  status: {
    pending_payment: "Payment pending",
    paid: "Paid",
    ready_for_pickup: "Ready for pickup",
    picked_up: "Picked up",
    expired: "Expired",
    cancelled: "Cancelled",
  },
};

describe("ShopOrderStatus", () => {
  it("shows status, snapshots, and pickup copy", () => {
    render(
      <ShopOrderStatus
        locale="en"
        order={{
          id: "o1",
          status: "paid",
          currency: "USD",
          total: 20,
          paidAt: "2026-09-04T12:00:00.000Z",
          readyAt: null,
          pickedUpAt: null,
          expiredAt: null,
          items: [
            {
              title: "Hoodie",
              size: "M",
              color: "Navy",
              sku: "HOODIE-M-NAVY",
              quantity: 1,
              unitPrice: 20,
            },
          ],
        }}
        labels={labels}
      />,
    );
    expect(screen.getByRole("heading", { name: labels.title })).toBeInTheDocument();
    expect(screen.getByText(labels.status.paid)).toBeInTheDocument();
    expect(screen.getByText("Hoodie")).toBeInTheDocument();
    expect(screen.getByText(labels.pickup)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminEventSalePulse } from "@/components/dashboard/admin/events/AdminEventSalePulse";
import { summarizeEventSale } from "@/lib/events/summarizeEventSale";
import en from "@/dictionaries/en.json";

const labels = en.admin.events.detail.sale;

describe("AdminEventSalePulse", () => {
  it("shows the free seat count and percent", () => {
    render(
      <AdminEventSalePulse
        locale="en"
        labels={labels}
        sale={summarizeEventSale({
          capacity: 10,
          confirmedCount: 4,
          pendingPaymentCount: 1,
          approvedPaymentCount: 3,
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: labels.title })).toBeInTheDocument();
    expect(screen.getByText("4 confirmed and 1 awaiting payment.")).toBeInTheDocument();
    expect(screen.getByText("3 approved payments.")).toBeInTheDocument();
    expect(screen.getByText("5 seats are free, 50% of capacity.")).toBeInTheDocument();
  });

  it("states that no seats are free when the room is full", () => {
    render(
      <AdminEventSalePulse
        locale="en"
        labels={labels}
        sale={summarizeEventSale({
          capacity: 2,
          confirmedCount: 2,
          pendingPaymentCount: 0,
          approvedPaymentCount: 2,
        })}
      />,
    );

    expect(screen.getByText(labels.full)).toBeInTheDocument();
    expect(screen.queryByText(/% of capacity/)).not.toBeInTheDocument();
  });
});

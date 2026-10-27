import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FinanceEventPaymentCard } from "@/components/dashboard/admin/finance/FinanceEventPaymentCard";

describe("FinanceEventPaymentCard", () => {
  it("shows the buyer, the event, a bold amount, and a status chip", () => {
    render(
      <ul>
        <FinanceEventPaymentCard
          attendeeName="Pérez Ana"
          eventTitle="Gala"
          amountLabel="$8.000"
          statusLabel="Pendiente"
          status="pending"
        />
      </ul>,
    );

    expect(screen.getByText("Pérez Ana")).toHaveClass("font-semibold");
    expect(screen.getByText("Gala")).toBeInTheDocument();
    expect(screen.getByText("$8.000")).toHaveClass("text-lg", "font-semibold");
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });
});

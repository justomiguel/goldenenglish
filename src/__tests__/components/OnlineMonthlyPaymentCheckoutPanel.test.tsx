import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  OnlineMonthlyPaymentCheckoutPanel,
} from "@/components/molecules/OnlineMonthlyPaymentCheckoutPanel";
import { dictEn } from "@/test/dictEn";

const labels = dictEn.dashboard.student.monthly;

describe("OnlineMonthlyPaymentCheckoutPanel", () => {
  it("renders nothing when no gateways are enabled", () => {
    const { container } = render(
      <OnlineMonthlyPaymentCheckoutPanel
        labels={labels}
        enabledGateways={[]}
        busy={false}
        onlineBusy={false}
        feedbackMessage={null}
        onPay={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders single gateway without radio buttons", () => {
    render(
      <OnlineMonthlyPaymentCheckoutPanel
        labels={labels}
        enabledGateways={["flow"]}
        busy={false}
        onlineBusy={false}
        feedbackMessage={null}
        onPay={vi.fn()}
      />,
    );
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByRole("button")).toBeDefined();
  });

  it("renders two gateways with radio selector", () => {
    render(
      <OnlineMonthlyPaymentCheckoutPanel
        labels={labels}
        enabledGateways={["flow", "mercadopago"]}
        busy={false}
        onlineBusy={false}
        feedbackMessage={null}
        onPay={vi.fn()}
      />,
    );
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBe(2);
  });

  it("calls onPay with selected gateway on button click", async () => {
    const onPay = vi.fn();
    render(
      <OnlineMonthlyPaymentCheckoutPanel
        labels={labels}
        enabledGateways={["flow", "mercadopago"]}
        busy={false}
        onlineBusy={false}
        feedbackMessage={null}
        onPay={onPay}
      />,
    );
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[1]!);
    fireEvent.click(screen.getByRole("button"));
    expect(onPay).toHaveBeenCalledWith("mercadopago");
  });

  it("calls onPay with only gateway when single option", async () => {
    const onPay = vi.fn();
    render(
      <OnlineMonthlyPaymentCheckoutPanel
        labels={labels}
        enabledGateways={["mercadopago"]}
        busy={false}
        onlineBusy={false}
        feedbackMessage={null}
        onPay={onPay}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onPay).toHaveBeenCalledWith("mercadopago");
  });

  it("shows feedback message when provided", () => {
    render(
      <OnlineMonthlyPaymentCheckoutPanel
        labels={labels}
        enabledGateways={["flow"]}
        busy={false}
        onlineBusy={false}
        feedbackMessage="Something went wrong"
        onPay={vi.fn()}
      />,
    );
    expect(screen.getByText("Something went wrong")).toBeDefined();
  });
});

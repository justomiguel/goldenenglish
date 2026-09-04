import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShopCheckoutForm } from "@/components/shop/ShopCheckoutForm";

vi.mock("@/app/[locale]/tienda/checkout/actions", () => ({
  startShopCheckoutAction: vi.fn(),
}));

const labels = {
  title: "Checkout",
  pickup: "Pickup at the institute.",
  email: "Email",
  emailHint: "We will create a parent account.",
  payFlow: "Pay with Flow",
  payMercadoPago: "Pay with Mercado Pago",
  noGateway: "Contact the institute.",
  studentForbidden: "Students cannot pay.",
  error: "Could not start payment.",
};

const line = {
  variantId: "v1",
  title: "Hoodie",
  size: "M",
  color: "Navy",
  unitPrice: 20,
  quantity: 1,
  priceLabel: "$20",
};

describe("ShopCheckoutForm", () => {
  it("asks a guest for email and shows configured gateways", () => {
    render(
      <ShopCheckoutForm
        locale="es"
        requireEmail
        studentForbidden={false}
        gateways={["flow"]}
        line={line}
        labels={labels}
      />,
    );
    expect(screen.getByRole("heading", { name: labels.title })).toBeInTheDocument();
    expect(screen.getByLabelText(labels.email)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.payFlow })).toBeInTheDocument();
  });

  it("hides pay buttons for a logged-in student", () => {
    render(
      <ShopCheckoutForm
        locale="es"
        requireEmail={false}
        studentForbidden
        gateways={["flow", "mercadopago"]}
        line={line}
        labels={labels}
      />,
    );
    expect(screen.getByText(labels.studentForbidden)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.payFlow })).not.toBeInTheDocument();
  });

  it("shows contact copy when no gateway is configured", () => {
    render(
      <ShopCheckoutForm
        locale="en"
        requireEmail={false}
        studentForbidden={false}
        gateways={[]}
        line={line}
        labels={labels}
      />,
    );
    expect(screen.getByText(labels.noGateway)).toBeInTheDocument();
  });
});

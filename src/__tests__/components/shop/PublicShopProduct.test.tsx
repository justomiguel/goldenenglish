import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PublicShopProduct } from "@/components/shop/PublicShopProduct";

const labels = {
  back: "Back to shop",
  size: "Size",
  color: "Color",
  price: "Price",
  soldOut: "Sold out",
  buy: "Buy",
  unavailable: "This option is out of stock.",
};

const product = {
  id: "hoodie",
  title: "Hoodie",
  description: "Warm layer",
  imageUrl: null,
  soldOut: false,
  variants: [
    { id: "empty", size: "S", color: "Navy", stock: 0, price: 20 },
    { id: "buyable", size: "M", color: "Navy", stock: 2, price: 20 },
  ],
};

describe("PublicShopProduct", () => {
  it("disables buy when the selected variant stock is 0", async () => {
    const user = userEvent.setup();
    render(
      <PublicShopProduct locale="en" currency="USD" product={product} labels={labels} />,
    );
    await user.click(screen.getByRole("radio", { name: /S/ }));
    expect(screen.getByRole("button", { name: labels.buy })).toBeDisabled();
  });

  it("enables buy when the selected variant has stock", async () => {
    render(
      <PublicShopProduct locale="en" currency="USD" product={product} labels={labels} />,
    );
    expect(screen.getByRole("link", { name: labels.buy })).toHaveAttribute(
      "href",
      "/en/tienda/checkout?variantId=buyable",
    );
  });
});

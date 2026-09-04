import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublicShopCatalog } from "@/components/shop/PublicShopCatalog";

const labels = {
  title: "Shop",
  lead: "Pickup at the institute.",
  empty: "No products available right now.",
  soldOut: "Sold out",
  viewProduct: "View product",
};

describe("PublicShopCatalog", () => {
  it("renders the empty state", () => {
    render(<PublicShopCatalog locale="en" rows={[]} labels={labels} />);
    expect(screen.getByRole("heading", { name: labels.title })).toBeInTheDocument();
    expect(screen.getByText(labels.empty)).toBeInTheDocument();
  });

  it("lists an active sold-out product", () => {
    render(
      <PublicShopCatalog
        locale="es"
        rows={[{ id: "p", title: "Polera", imageUrl: null, soldOut: true }]}
        labels={labels}
      />,
    );
    expect(screen.getByRole("link", { name: /Polera/ })).toHaveAttribute("href", "/es/tienda/p");
    expect(screen.getByText(labels.soldOut)).toBeInTheDocument();
  });
});

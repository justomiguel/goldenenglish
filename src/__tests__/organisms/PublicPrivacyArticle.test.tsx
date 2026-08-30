import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublicPrivacyArticle } from "@/components/organisms/PublicPrivacyArticle";
import { dictEn } from "@/test/dictEn";
import esDict from "@/dictionaries/es.json";

describe("PublicPrivacyArticle", () => {
  it("interpolates the institute name and does not mention payment gateways", () => {
    render(
      <PublicPrivacyArticle
        locale="es"
        dict={dictEn}
        contact={{
          legalName: "Capoeira Nagô",
          name: "Nagô",
          legalRegistry: "76.1",
          contactEmail: "hola@nago.cl",
          contactPhone: "+56 9 1111",
          contactAddress: "Santiago",
        }}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      dictEn.privacy.title,
    );
    expect(screen.getAllByText(/Capoeira Nagô/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "hola@nago.cl" })).toHaveAttribute(
      "href",
      "mailto:hola@nago.cl",
    );
    expect(screen.getByText("+56 9 1111")).toBeInTheDocument();
    expect(screen.getByText("Santiago")).toBeInTheDocument();
    expect(screen.getByText("76.1")).toBeInTheDocument();
    const back = screen.getByRole("link", { name: dictEn.privacy.backHome });
    expect(back).toHaveAttribute("href", "/es");
    expect(back.className).toMatch(/min-h-\[44px\]/);
    expect(back.className).toMatch(/focus-visible:ring-2/);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute("id", "privacy-page-title");
    expect(screen.getByRole("link", { name: "hola@nago.cl" }).className).toMatch(
      /focus-visible:ring-2/,
    );
    const text = document.body.textContent ?? "";
    expect(text.toLowerCase()).not.toMatch(/mercado\s*pago|pasarela|\bflow\b/);
  });

  it("keeps Spanish legal copy free of payment-gateway claims", () => {
    const blob = JSON.stringify(esDict.privacy).toLowerCase();
    expect(blob).not.toMatch(/mercado\s*pago|pasarela|\bflow\b/);
    expect(esDict.privacy.sections.who.body).toContain("empresas de afuera");
  });
});

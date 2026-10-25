import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { PulsarLandingHome } from "@/components/organisms/pulsar/PulsarLandingHome";
import { PulsarProductoView } from "@/components/organisms/pulsar/PulsarProductoView";
import { PulsarClientesView } from "@/components/organisms/pulsar/PulsarClientesView";
import { PulsarContactoView } from "@/components/organisms/pulsar/PulsarContactoView";

const dict = es as unknown as Dictionary;

describe("Pulsar multi-page marketing views", () => {
  it("renders the Pulsar home view with tenant count and navigation links", () => {
    render(<PulsarLandingHome locale="es" dict={dict} activeTenantCount={6} />);

    expect(screen.getByRole("heading", { name: dict.pulsar.home.title })).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: dict.pulsar.nav.admin })[0],
    ).toHaveAttribute("href", "/es/admin");
  });

  it("renders the Producto view with all 6 platform modules", () => {
    render(<PulsarProductoView locale="es" dict={dict} />);

    expect(screen.getByRole("heading", { name: dict.pulsar.product.title })).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.product.m1Title)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.product.m6Title)).toBeInTheDocument();
  });

  it("renders the Clientes view listing configured institutes", () => {
    render(
      <PulsarClientesView
        locale="es"
        dict={dict}
        clients={[
          {
            slug: "nago",
            displayName: "Capoeira Nagô Chile",
            hosts: ["capoeiranago.cl"],
            publicUrl: "https://www.capoeiranago.cl",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: dict.pulsar.clients.title })).toBeInTheDocument();
    expect(screen.getByText("Capoeira Nagô Chile")).toBeInTheDocument();
    expect(screen.getByText("capoeiranago.cl")).toBeInTheDocument();
  });

  it("renders the Contacto view with direct email and onboarding checklist", () => {
    render(<PulsarContactoView locale="es" dict={dict} />);

    expect(screen.getByRole("heading", { name: dict.pulsar.contact.title })).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.contact.emailValue)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.contact.check1)).toBeInTheDocument();
  });
});

// REGRESSION CHECK: CentroListo public pages render the home, product ledger,
// school directory, and a calm conversation page.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/es",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/[locale]/contact/actions", () => ({
  submitPublicContactForm: vi.fn().mockResolvedValue({ ok: true }),
}));
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";
import { PulsarLandingHome } from "@/components/organisms/pulsar/PulsarLandingHome";
import { PulsarProductoView } from "@/components/organisms/pulsar/PulsarProductoView";
import { PulsarClientesView } from "@/components/organisms/pulsar/PulsarClientesView";
import { PulsarContactoView } from "@/components/organisms/pulsar/PulsarContactoView";

const dict = es as unknown as Dictionary;

describe("CentroListo multi-page growth & marketing views", () => {
  it("renders the house home in order", () => {
    render(<PulsarLandingHome locale="es" dict={dict} activeTenantCount={6} />);
    const house = dict.pulsar.home.house;

    expect(screen.getByRole("heading", { level: 1, name: dict.pulsar.home.title })).toBeInTheDocument();
    expect(screen.getByText(house.fact.replace("{count}", "6"))).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: house.siteAlt }).length).toBeGreaterThan(0);
    expect(screen.queryByText(dict.pulsar.home.eyebrow)).toBeNull();
    expect(screen.queryByRole("heading", { name: dict.pulsar.solutions.sectionTitle })).toBeNull();
    expect(screen.queryByRole("button", { name: dict.pulsar.clients.voicesPrev })).toBeNull();
    expect(screen.queryByText(dict.pulsar.clients.voices[0].quote)).toBeNull();
    expect(document.querySelector(`.${styles.heroStage}`)).toBeNull();

    const names = [
      house.sundayLine,
      house.tuesdayLine,
      house.dayLine,
      house.fridayLine,
      house.closeTitle,
    ];
    const headings = names.map((name) => screen.getByRole("heading", { name }));
    const order = headings.map((node) => node.compareDocumentPosition(headings[0]));
    expect(order.every((flag, index) => index === 0 || flag & Node.DOCUMENT_POSITION_PRECEDING)).toBe(true);

    const signupLinks = screen.getAllByRole("link", { name: dict.pulsar.home.freeSiteCta });
    expect(signupLinks).toHaveLength(2);
    for (const link of signupLinks) {
      expect(link).toHaveAttribute("href", "/es/cuenta/registro");
      expect(link).toHaveAttribute("data-cl-event", "cl_create_free_page");
    }
    expect(screen.getByRole("combobox", { name: dict.pulsar.market.label })).toHaveTextContent(dict.pulsar.market.cl);
  });

  it("does not list a featured client on the home", () => {
    render(
      <PulsarLandingHome
        locale="es"
        dict={dict}
        activeTenantCount={2}
        featuredClients={[
          {
            slug: "golden",
            displayName: "Golden English",
            hosts: ["goldenenglish.cl"],
            publicUrl: "https://www.goldenenglish.cl",
            previewVideoSrc: "/centrolisto/clients/golden.webm",
            previewPosterSrc: "/centrolisto/clients/golden.jpg",
            logoSrc: "/images/golden/logo/1.png",
          },
        ]}
      />,
    );

    expect(screen.queryByText("Golden English")).toBeNull();
    expect(screen.queryByText(dict.pulsar.home.schoolsNamed.replace("{name}", "Golden English"))).toBeNull();
  });

  it("renders the Producto view with all 12 platform modules and no competitor matrix", () => {
    render(<PulsarProductoView locale="es" dict={dict} />);

    expect(screen.getByRole("heading", { name: dict.pulsar.product.title })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: dict.pulsar.product.stages.stage1 })).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.product.m1Title)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.product.m6Title)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.product.m7Title)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.product.m12Title)).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", { name: dict.pulsar.product.comparison.title }),
    ).toBeNull();
  });

  it("renders the Clientes view listing configured institutes and industry ledgers", () => {
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
            logoSrc: "/images/nago/logo/logo.png",
          },
          {
            slug: "golden",
            displayName: "Golden English",
            hosts: ["goldenenglish.cl"],
            publicUrl: "https://www.goldenenglish.cl",
            previewVideoSrc: "/centrolisto/clients/golden.webm",
            previewPosterSrc: "/centrolisto/clients/golden.jpg",
            logoSrc: "/images/golden/logo/1.png",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: dict.pulsar.clients.title })).toBeInTheDocument();
    expect(screen.getByText("Capoeira Nagô Chile")).toBeInTheDocument();
    expect(screen.queryByText("capoeiranago.cl")).toBeNull();
    expect(screen.queryByText(dict.pulsar.clients.hostsLabel)).toBeNull();
    const nagoHeading = screen.getByRole("heading", { name: "Capoeira Nagô Chile" });
    expect(nagoHeading.closest("li")?.querySelector("video")).toBeNull();
    const goldenLink = screen.getByRole("link", {
      name: dict.pulsar.clients.visitSiteNamed.replace("{name}", "Golden English"),
    });
    expect(goldenLink).toHaveAttribute("href", "https://www.goldenenglish.cl");
    expect(goldenLink.querySelector("video")).toBeNull();
    expect(goldenLink.querySelector('img[src*="golden.jpg"]')).toBeTruthy();
    const goldenHeading = screen.getByRole("heading", { name: "Golden English" });
    expect(goldenHeading.previousElementSibling?.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("/images/golden/logo/1.png"),
    );
    expect(goldenLink).toHaveTextContent(dict.pulsar.clients.visitSite);
    expect(nagoHeading.previousElementSibling?.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("/images/nago/logo/logo.png"),
    );
    expect(nagoHeading.closest("li")).toHaveTextContent(dict.pulsar.clients.visitSite);
    expect(
      screen.getByRole("heading", { name: dict.pulsar.clients.voicesTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.clients.voices[0].quote)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.clients.voices[5].quote)).toBeInTheDocument();
  });

  it("renders the Contacto view with accompaniment steps, WhatsApp, checklist, and FAQs", () => {
    render(<PulsarContactoView locale="es" dict={dict} />);

    expect(screen.getByRole("heading", { name: dict.pulsar.contact.title })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: dict.pulsar.home.heroImageAlt })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: dict.pulsar.contact.stepsTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.contact.steps[0].title)).toBeInTheDocument();
    expect(screen.queryByText(dict.pulsar.contact.emailValue)).toBeNull();
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(screen.getByLabelText(dict.publicContact.fullName)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dict.pulsar.contact.submitCta })).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.contact.check1)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.contact.check5)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: dict.pulsar.contact.faqTitle })).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.contact.faqs[0].q)).toBeInTheDocument();
    const faqLd = document.querySelector('script[type="application/ld+json"]');
    expect(faqLd?.textContent).toContain('"@type":"FAQPage"');
    expect(faqLd?.textContent).toContain(dict.pulsar.contact.faqs[0].q);
  });
});

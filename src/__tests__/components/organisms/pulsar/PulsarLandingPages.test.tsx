// REGRESSION CHECK: CentroListo public pages render Logo A, the quiet week chronicle,
// numbered product ledger, school directory, and a calm conversation page.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/[locale]/contact/actions", () => ({
  submitPublicContactForm: vi.fn().mockResolvedValue({ ok: true }),
}));
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { PulsarLandingHome } from "@/components/organisms/pulsar/PulsarLandingHome";
import { PulsarProductoView } from "@/components/organisms/pulsar/PulsarProductoView";
import { PulsarClientesView } from "@/components/organisms/pulsar/PulsarClientesView";
import { PulsarContactoView } from "@/components/organisms/pulsar/PulsarContactoView";

const dict = es as unknown as Dictionary;

describe("CentroListo multi-page growth & marketing views", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLVideoElement.prototype, "play", {
      configurable: true,
      value: () => Promise.resolve(),
    });
  });

  it("renders Logo A, the four quiet week moments, and the three silences", async () => {
    const user = userEvent.setup();
    render(<PulsarLandingHome locale="es" dict={dict} activeTenantCount={6} />);

    expect(screen.getByRole("heading", { name: dict.pulsar.home.title })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: dict.pulsar.home.heroImageAlt })).toBeInTheDocument();
    expect(screen.getByTestId("centrolisto-generative-logo")).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.home.generativeStage.resolvedCaption)).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: dict.pulsar.home.portals.tabs[0].headline }),
    ).toBeInTheDocument();
    expect(document.querySelector('img[src="/pulsar/partners/whatsapp.svg"]')).toBeTruthy();
    expect(screen.getByTestId("pulsar-portal-video")).toHaveAttribute(
      "src",
      "/videos/centrolisto/flow-0-desktop.webm",
    );

    await user.click(screen.getByRole("button", { name: dict.pulsar.home.portals.videoSurfaceMobile }));
    expect(screen.getByTestId("pulsar-portal-video")).toHaveAttribute(
      "src",
      "/videos/centrolisto/flow-0-mobile.webm",
    );

    await user.click(
      screen.getByRole("tab", { name: dict.pulsar.home.portals.tabs[2].label }),
    );
    expect(document.querySelector('img[src="/pulsar/partners/flow.svg"]')).toBeTruthy();
    expect(document.querySelector('img[src="/pulsar/partners/mercadopago.svg"]')).toBeTruthy();

    await user.click(
      screen.getByRole("tab", { name: dict.pulsar.home.portals.tabs[3].label }),
    );
    expect(
      screen.getByRole("heading", { name: dict.pulsar.home.portals.tabs[3].headline }),
    ).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.home.portals.tabs[3].bullets[0])).toBeInTheDocument();
    expect(screen.getByTestId("pulsar-portal-video")).toHaveAttribute(
      "src",
      "/videos/centrolisto/flow-3-mobile.webm",
    );

    expect(
      screen.getByRole("heading", { name: dict.pulsar.home.pillarsTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.home.pillar1Title)).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: dict.pulsar.nav.admin })[0],
    ).toHaveAttribute("href", "/es/admin");

    const video = screen.getByTestId("pulsar-portal-video");
    const sunday = screen.getByRole("heading", {
      name: dict.pulsar.home.portals.tabs[3].headline,
    });
    expect(video.compareDocumentPosition(sunday) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole("link", { name: dict.pulsar.account.registerTitle })).toBeNull();
    expect(screen.getByText(dict.pulsar.home.craftsLine)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.home.offerStrip)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.home.faq[0].q)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.contact.steps[0].title)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: dict.pulsar.home.freeSiteCta })).toHaveAttribute(
      "href",
      "/es/cuenta/registro",
    );
    for (const link of screen.getAllByRole("link", { name: dict.pulsar.home.whatsappCta })) {
      expect(link).toHaveAttribute("href", dict.pulsar.contact.whatsappHref);
    }
  });

  it("shows two live schools on the home when they have a public link", () => {
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

    expect(screen.getByText("Golden English")).toBeInTheDocument();
    expect(
      screen.getByText(dict.pulsar.home.schoolsNamed.replace("{name}", "Golden English")),
    ).toBeInTheDocument();
    const visit = screen.getByRole("link", {
      name: dict.pulsar.clients.visitSiteNamed.replace("{name}", "Golden English"),
    });
    expect(visit.querySelector("source")?.getAttribute("src")).toBe(
      "/centrolisto/clients/golden.webm",
    );
  });

  it("renders the Producto view with all 12 platform modules and the competitor comparison matrix", () => {
    render(<PulsarProductoView locale="es" dict={dict} />);

    expect(screen.getByRole("heading", { name: dict.pulsar.product.title })).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.product.m1Title)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.product.m6Title)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.product.m7Title)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.product.m12Title)).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: dict.pulsar.product.comparison.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.product.comparison.rows[0].feature)).toBeInTheDocument();
    expect(
      screen.getByText(dict.pulsar.product.comparison.rows[6].centroListo),
    ).toBeInTheDocument();
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
    const goldenVideo = goldenLink.querySelector("video");
    expect(goldenVideo).toBeTruthy();
    expect(goldenVideo?.getAttribute("poster")).toBe("/centrolisto/clients/golden.jpg");
    expect(goldenVideo?.querySelector("source")?.getAttribute("src")).toBe(
      "/centrolisto/clients/golden.webm",
    );
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
      screen.getByRole("heading", { name: dict.pulsar.clients.verticalsTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.clients.verticals[0].title)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.clients.verticals[5].title)).toBeInTheDocument();
  });

  it("renders the Contacto view with accompaniment steps, WhatsApp, checklist, and FAQs", () => {
    render(<PulsarContactoView locale="es" dict={dict} />);

    expect(screen.getByRole("heading", { name: dict.pulsar.contact.title })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: dict.pulsar.contact.stepsTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.contact.steps[0].title)).toBeInTheDocument();
    expect(screen.queryByText(dict.pulsar.contact.emailValue)).toBeNull();
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(screen.getByLabelText(dict.publicContact.fullName)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dict.publicContact.submit })).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.contact.check1)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.contact.check5)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: dict.pulsar.contact.faqTitle })).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.contact.faqs[0].q)).toBeInTheDocument();
    const faqLd = document.querySelector('script[type="application/ld+json"]');
    expect(faqLd?.textContent).toContain('"@type":"FAQPage"');
    expect(faqLd?.textContent).toContain(dict.pulsar.contact.faqs[0].q);
  });
});

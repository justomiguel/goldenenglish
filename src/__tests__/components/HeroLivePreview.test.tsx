import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HeroLivePreview } from "@/components/dashboard/admin/cms/HeroLivePreview";
import type { LandingCopyFieldDescriptor } from "@/lib/cms/buildLandingEditorViewModel";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

const labels = {
  openCta: "Open hero",
  title: "Hero",
  lead: "Lead",
  copyTitle: "Copy",
  mediaTitle: "Media",
  mediaLead: "Slots",
  previewTitle: "Live preview",
  slotPlaceholder: "Slot {{position}}",
};

function field(
  key: string,
  defaults: { es: string; en: string },
): LandingCopyFieldDescriptor {
  return {
    key,
    defaults,
    overrides: { es: null, en: null },
  };
}

const FIELDS: ReadonlyArray<LandingCopyFieldDescriptor> = [
  field("hero.kicker", { es: "Bienvenidos", en: "Welcome" }),
  field("hero.ctaRegister", { es: "Inscribirme", en: "Register" }),
  field("hero.ctaSignedIn", { es: "Ir al panel", en: "Open dashboard" }),
  field("hero.whatsappCta", { es: "WhatsApp", en: "WhatsApp" }),
];

describe("HeroLivePreview", () => {
  it("falls back to the dictionary defaults when the draft is empty", () => {
    render(
      <HeroLivePreview
        labels={labels}
        fields={FIELDS}
        draft={{}}
        locale="es"
        brandName="Golden English"
        media={[
          { position: 1, src: null },
          { position: 2, src: null },
          { position: 3, src: null },
        ]}
      />,
    );
    expect(screen.getByText("Bienvenidos")).toBeInTheDocument();
    expect(screen.getByText("Golden English")).toBeInTheDocument();
    expect(screen.getByText("Inscribirme")).toBeInTheDocument();
    expect(screen.getByText("Slot 1")).toBeInTheDocument();
  });

  it("prefers the typed draft over the defaults", () => {
    render(
      <HeroLivePreview
        labels={labels}
        fields={FIELDS}
        draft={{
          "hero.kicker": { es: "Hola", en: "Hi" },
          "hero.ctaRegister": { es: "Quiero entrar", en: "Sign up" },
        }}
        locale="es"
        brandName="GE"
        media={[]}
      />,
    );
    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(screen.getByText("Quiero entrar")).toBeInTheDocument();
    expect(screen.queryByText("Bienvenidos")).toBeNull();
  });

  it("uses the English defaults when the preview locale is en", () => {
    render(
      <HeroLivePreview
        labels={labels}
        fields={FIELDS}
        draft={{}}
        locale="en"
        brandName="Golden English"
        media={[]}
      />,
    );
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  it("renders an <img> when the slot has a src and a placeholder otherwise", () => {
    const { container } = render(
      <HeroLivePreview
        labels={labels}
        fields={FIELDS}
        draft={{}}
        locale="es"
        brandName="GE"
        media={[
          { position: 1, src: "/x.png" },
          { position: 2, src: null },
        ]}
      />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "/x.png");
    expect(screen.getByText("Slot 2")).toBeInTheDocument();
  });
});

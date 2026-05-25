import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { dictEn } from "@/test/dictEn";

// ── infrastructure mocks ──────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/en",
}));

vi.mock("@/app/[locale]/contact/actions", () => ({
  submitPublicContactForm: vi.fn().mockResolvedValue({ ok: true }),
}));

// ── component under test ──────────────────────────────────────────────────────
import { MiMundoLandingContactPanel } from "@/components/organisms/MiMundoLandingContactPanel";

const defaultProps = {
  dict: dictEn,
  locale: "en",
};

describe("MiMundoLandingContactPanel — smoke", () => {
  it("renders the contact section anchor", () => {
    const { container } = render(<MiMundoLandingContactPanel {...defaultProps} />);
    const section = container.querySelector("#contacto");
    expect(section).not.toBeNull();
  });

  it("renders the embedded contact form", () => {
    render(<MiMundoLandingContactPanel {...defaultProps} />);
    // The submit button is present in the embedded PublicContactForm
    const submitBtn = screen.getByRole("button", { name: /send|enviar|enviar|submit|contacto/i });
    expect(submitBtn).toBeInTheDocument();
  });

  it("renders the form lead text from dict.publicContact.lead", () => {
    render(<MiMundoLandingContactPanel {...defaultProps} />);
    const lead = dictEn.publicContact?.lead;
    if (lead) {
      expect(screen.getByText(lead)).toBeInTheDocument();
    }
  });

  it("contains email and name inputs", () => {
    render(<MiMundoLandingContactPanel {...defaultProps} />);
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /name|nombre/i }),
    ).toBeInTheDocument();
  });
});

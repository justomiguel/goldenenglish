import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { LandingContactBand } from "@/components/organisms/LandingContactBand";

describe("LandingContactBand", () => {
  // REGRESSION CHECK: #contacto is the canonical in-page anchor; form stays on the landing shell.
  it("anchors #contacto and embeds public contact fields", () => {
    render(<LandingContactBand dict={dictEn} locale="es" />);
    expect(document.getElementById("contacto")).not.toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: dictEn.publicContact.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(dictEn.publicContact.lead)).toBeInTheDocument();
    expect(screen.getByLabelText(dictEn.publicContact.fullName)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dictEn.publicContact.submit })).toBeInTheDocument();
  });
});

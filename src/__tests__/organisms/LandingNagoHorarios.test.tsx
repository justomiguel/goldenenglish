import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  formatNagoClp,
  LandingNagoHorarios,
} from "@/components/organisms/LandingNagoHorarios";
import { dictEn } from "@/test/dictEn";

describe("LandingNagoHorarios", () => {
  it("renders the Ñuñoa groups, fee cards, and venue from the flyer", () => {
    render(<LandingNagoHorarios dict={dictEn} locale="en" />);

    expect(screen.getByRole("heading", { name: dictEn.landing.nago.horarios.sectionTitle })).toBeTruthy();
    expect(screen.getByText(dictEn.landing.nago.horarios.venue)).toBeTruthy();
    expect(screen.getByText(dictEn.landing.nago.horarios.baby.slots)).toBeTruthy();
    expect(screen.getByText(dictEn.landing.nago.horarios.kids47.slots)).toBeTruthy();
    expect(screen.getByText(dictEn.landing.nago.horarios.mixta.slots)).toBeTruthy();
    expect(screen.getByText(dictEn.landing.nago.horarios.mayores.note)).toBeTruthy();
    expect(screen.getByText(dictEn.landing.nago.horarios.timesOne)).toBeTruthy();
    expect(screen.getByText(dictEn.landing.nago.horarios.timesMany.replace("{n}", "3"))).toBeTruthy();
    expect(screen.getAllByText(formatNagoClp(40_000, "en")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(formatNagoClp(15_000, "en")).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: dictEn.landing.nago.horarios.cta })).toHaveAttribute(
      "href",
      "/en/register",
    );
  });
});

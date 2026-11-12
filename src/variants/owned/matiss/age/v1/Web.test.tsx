import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatissAgeFinder } from "@/variants/owned/matiss/age/v1/Web";

const props = {
  title: "¿Cuántos años tiene?",
  lead: "Elige su edad",
  yearsLabel: "años",
  emptyLabel: "Sin grupo",
  dayLabels: { saturday: "Sábado", sunday: "Domingo" },
  locationNames: { sanMiguel: "San Miguel", laFlorida: "La Florida" },
  groupNames: {
    "babys-san-miguel": "Babys",
    "senior-san-miguel": "Senior",
    "babys-la-florida": "Babys",
  },
  photoSmall: "/images/matiss/fotos/sentada.jpg",
  photoBig: "/images/matiss/fotos/grande.jpg",
  photoAltSmall: "Alumna pequeña",
  photoAltBig: "Alumna mayor",
};

describe("MatissAgeFinder", () => {
  it("shows the younger photo at age 5 and the older photo at age 10", () => {
    render(<MatissAgeFinder {...props} />);

    expect(screen.getByRole("img", { name: "Alumna pequeña" })).toHaveAttribute(
      "src",
      "/images/matiss/fotos/sentada.jpg",
    );

    fireEvent.click(screen.getByRole("radio", { name: "10" }));

    expect(screen.getByRole("img", { name: "Alumna mayor" })).toHaveAttribute(
      "src",
      "/images/matiss/fotos/grande.jpg",
    );
  });
});

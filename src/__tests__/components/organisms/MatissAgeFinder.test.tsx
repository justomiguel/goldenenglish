import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatissAgeFinder } from "@/components/organisms/MatissAgeFinder";

const props = {
  title: "¿Cuántos años tiene?",
  lead: "Elige su edad",
  yearsLabel: "años",
  emptyLabel: "Sin grupo",
  dayLabel: "Sábado",
  locationNames: { sanMiguel: "San Miguel", laFlorida: "La Florida" },
  groupNames: {
    "babys-san-miguel": "Babys",
    "senior-san-miguel": "Senior",
    "babys-la-florida": "Babys",
  },
  photoSmall: "/images/matiss/personajes/pequena.jpg",
  photoBig: "/images/matiss/personajes/grande.jpg",
  photoAltSmall: "Alumna pequeña",
  photoAltBig: "Alumna mayor",
};

describe("MatissAgeFinder", () => {
  it("shows the younger photo at age 5 and the older photo at age 10", () => {
    render(<MatissAgeFinder {...props} />);

    expect(screen.getByRole("img", { name: "Alumna pequeña" })).toHaveAttribute(
      "src",
      "/images/matiss/personajes/pequena.jpg",
    );

    fireEvent.click(screen.getByRole("radio", { name: "10" }));

    expect(screen.getByRole("img", { name: "Alumna mayor" })).toHaveAttribute(
      "src",
      "/images/matiss/personajes/grande.jpg",
    );
  });
});

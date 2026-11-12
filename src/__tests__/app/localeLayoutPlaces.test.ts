import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildInstituteDepartments,
  placesForOrganization,
} from "@/lib/public/instituteAnswerPages";

const layoutSource = readFileSync(
  path.join(process.cwd(), "src/app/[locale]/layout.tsx"),
  "utf8",
);

describe("locale layout places", () => {
  it("does not name Liora in the layout", () => {
    expect(layoutSource.toLowerCase()).not.toContain("liora");
  });

  it("builds a place from the contact address", () => {
    const places = placesForOrganization({
      name: "Liora",
      contactAddress: "Seminario 130, Providencia",
    });
    expect(places).toEqual([
      { name: "Liora", description: "Seminario 130, Providencia" },
    ]);
    expect(buildInstituteDepartments(places)[0]).toMatchObject({
      "@type": "Place",
      name: "Liora",
      description: "Seminario 130, Providencia",
    });
  });

  it("gives Golden no Liora sites when the address is still a placeholder", () => {
    const places = placesForOrganization({
      name: "Golden",
      contactAddress: "Centro urbano — reemplaza con tu dirección",
    });
    expect(places).toEqual([]);
    expect(JSON.stringify(places)).not.toMatch(/Providencia|Maipú|San Miguel/);
  });

  it("prefers places stored on the answers page", () => {
    const places = placesForOrganization({
      name: "Liora",
      contactAddress: "Seminario 130, Providencia",
      answerSections: [
        {
          props: {
            places: [{ name: "Ñuñoa", description: "Metro Irarrázaval" }],
          },
        },
      ],
    });
    expect(places).toEqual([{ name: "Ñuñoa", description: "Metro Irarrázaval" }]);
  });
});

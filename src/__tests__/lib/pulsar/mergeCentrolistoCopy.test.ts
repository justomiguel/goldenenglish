// REGRESSION CHECK: A country overlay replaces only the keys it sets.
import { describe, expect, it } from "vitest";
import { mergeCentrolistoCopy } from "@/lib/pulsar/mergeCentrolistoCopy";

describe("mergeCentrolistoCopy", () => {
  it("replaces a present key and keeps a missing key", () => {
    const merged = mergeCentrolistoCopy(
      { lead: "Puedes crear", note: "Plantilla gratis" },
      { lead: "Podés crear" },
    );
    expect(merged).toEqual({ lead: "Podés crear", note: "Plantilla gratis" });
  });

  it("keeps an array item when the overlay slot is null", () => {
    const merged = mergeCentrolistoCopy(
      ["Inscripciones.", "Puedes crear rutas."],
      [null, "Podés crear rutas."],
    );
    expect(merged).toEqual(["Inscripciones.", "Podés crear rutas."]);
  });
});

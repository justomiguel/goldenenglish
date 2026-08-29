/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { publicRegisterCtaItems } from "@/lib/settings/publicRegisterCtaItems";

const labels = {
  locale: "es",
  reserveLabel: "Reservá tu cupo",
  trialLabel: "Agendá tu clase de prueba",
};

describe("publicRegisterCtaItems", () => {
  it("hides every CTA when inscriptions are off", () => {
    expect(
      publicRegisterCtaItems({
        ...labels,
        mode: "both",
        inscriptionsEnabled: false,
      }),
    ).toEqual([]);
  });

  it("returns only reserve, only trial, or both", () => {
    expect(
      publicRegisterCtaItems({
        ...labels,
        mode: "reserve",
        inscriptionsEnabled: true,
      }),
    ).toEqual([
      { href: "/es/register", label: "Reservá tu cupo", intent: "reserve" },
    ]);
    expect(
      publicRegisterCtaItems({
        ...labels,
        mode: "trial",
        inscriptionsEnabled: true,
      }),
    ).toEqual([
      {
        href: "/es/register?intent=trial",
        label: "Agendá tu clase de prueba",
        intent: "trial",
      },
    ]);
    expect(
      publicRegisterCtaItems({
        ...labels,
        mode: "both",
        inscriptionsEnabled: true,
      }).map((i) => i.intent),
    ).toEqual(["reserve", "trial"]);
  });
});

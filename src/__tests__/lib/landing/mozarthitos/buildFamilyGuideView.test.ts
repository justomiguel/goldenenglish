import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import { buildFamilyGuideView } from "@/lib/landing/mozarthitos/buildFamilyGuideView";
import { resolveFamilyGuide } from "@/lib/landing/mozarthitos/resolveFamilyGuide";
import type { MzGuideAgeBand, MzGuideAttendance } from "@/lib/landing/mozarthitos/familyGuideCatalog";

const labels = es.landing.mz.guide;
const place = "Sede Las Condes · República Árabe de Egipto 670";

function view(ageBand: MzGuideAgeBand, attendance: MzGuideAttendance) {
  return buildFamilyGuideView({
    locale: "es",
    ageBand,
    result: resolveFamilyGuide({ ageBand, attendance }),
    labels,
    place,
  });
}

describe("buildFamilyGuideView", () => {
  it("links a waitlist to a reserve registration", () => {
    const v = view("under_6m", "remote");
    expect(v.kind).toBe("waitlist");
    if (v.kind !== "waitlist") return;
    expect(v.href).toBe("/es/register?intent=reserve&guide=baby_mago.live_online.under_6m");
  });

  it("offers live online and pack to a remote toddler family", () => {
    const v = view("6m_2y", "remote");
    if (v.kind !== "recommendation") throw new Error("expected recommendation");
    expect(v.primary.title).toBe("Baby Mago");
    expect(v.primary.offers.map((o) => o.id)).toEqual(["live_online", "pack"]);
    expect(v.primary.offers[1]?.href).toBe("/es/register?intent=trial&guide=baby_mago.pack.6m_2y");
    expect(v.primary.offers.every((o) => o.place === null)).toBe(true);
    expect(v.choir?.href).toBe("/es/register?intent=trial&guide=adult_choir.in_person.adult");
  });

  it("shows the sede only on the in-person offer", () => {
    const v = view("3y_4y", "unsure");
    if (v.kind !== "recommendation") throw new Error("expected recommendation");
    expect(v.primary.offers[0]).toMatchObject({ id: "in_person", place });
  });

  it("sends remote instrument families to contact and keeps the second option", () => {
    const v = view("5y_7y", "remote");
    if (v.kind !== "recommendation") throw new Error("expected recommendation");
    expect(v.secondary?.stage).toBe("instrument");
    expect(v.secondary?.offers).toEqual([
      expect.objectContaining({ id: "contact", href: "/es#contacto" }),
    ]);
  });

  it("hides the choir link for adults", () => {
    const v = view("adult", "in_person");
    if (v.kind !== "recommendation") throw new Error("expected recommendation");
    expect(v.choir).toBeNull();
  });
});

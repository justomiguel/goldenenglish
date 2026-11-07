import { describe, expect, it } from "vitest";
import { parseSkinContent, parseSkinSectionPatch } from "@/lib/landing/skin/skinContentSchema";

// REGRESSION CHECK: parseSkinContent must never throw; a malformed row must not break the public site.
describe("parseSkinContent", () => {
  it("returns an empty v1 model for junk", () => {
    expect(parseSkinContent(null)).toEqual({ v: 1, sections: {} });
    expect(parseSkinContent("x")).toEqual({ v: 1, sections: {} });
    expect(parseSkinContent({ v: 2 })).toEqual({ v: 1, sections: {} });
  });

  it("drops unknown sections, fields, and lists", () => {
    const parsed = parseSkinContent({
      v: 1,
      sections: {
        inicio: { fields: { title: { es: "Hola" }, hack: { es: "x" } } },
        nope: { fields: { title: { es: "x" } } },
        oferta: { lists: { items: [{ id: "a", name: { es: "Fútbol" } }], other: [] } },
      },
    });
    expect(parsed.sections).toEqual({
      inicio: { fields: { title: { es: "Hola" } } },
      oferta: { lists: { items: [{ id: "a", name: { es: "Fútbol" } }] } },
    });
  });

  it("trims lists to their maximum", () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ q: { es: `q${i}` }, a: { es: "a" } }));
    const parsed = parseSkinContent({ v: 1, sections: { faq: { lists: { entries: items } } } });
    expect(parsed.sections.faq?.lists?.entries).toHaveLength(12);
  });
});

describe("parseSkinSectionPatch", () => {
  it("accepts a valid patch", () => {
    const result = parseSkinSectionPatch("faq", {
      fields: { label: { es: "Preguntas" } },
      lists: { entries: [{ q: { es: "¿Hay prueba?" }, a: { es: "Sí." } }] },
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a list over the maximum", () => {
    const entries = Array.from({ length: 13 }, () => ({ q: { es: "q" }, a: { es: "a" } }));
    expect(parseSkinSectionPatch("faq", { lists: { entries } })).toEqual({ ok: false, code: "list_too_long" });
  });

  it("rejects text over the limit", () => {
    expect(parseSkinSectionPatch("inicio", { fields: { title: { es: "x".repeat(161) } } }))
      .toEqual({ ok: false, code: "text_too_long" });
  });

  it("rejects unknown keys", () => {
    expect(parseSkinSectionPatch("inicio", { fields: { hack: { es: "x" } } }))
      .toEqual({ ok: false, code: "invalid_input" });
  });

  it("rejects an item text over the limit", () => {
    const entries = [{ q: { es: "x".repeat(161) }, a: { es: "a" } }];
    expect(parseSkinSectionPatch("faq", { lists: { entries } })).toEqual({ ok: false, code: "text_too_long" });
  });

  it("allows long text in long fields", () => {
    const entries = [{ q: { es: "q" }, a: { es: "x".repeat(900) } }];
    expect(parseSkinSectionPatch("faq", { lists: { entries } }).ok).toBe(true);
    const tooLong = [{ q: { es: "q" }, a: { es: "x".repeat(901) } }];
    expect(parseSkinSectionPatch("faq", { lists: { entries: tooLong } })).toEqual({ ok: false, code: "text_too_long" });
  });

  it("rejects an invalid item id", () => {
    const items = [{ id: "Bad Id!", name: { es: "Fútbol" } }];
    expect(parseSkinSectionPatch("oferta", { lists: { items } })).toEqual({ ok: false, code: "invalid_input" });
  });
});

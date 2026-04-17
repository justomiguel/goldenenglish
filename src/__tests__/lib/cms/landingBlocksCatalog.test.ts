import { describe, expect, it } from "vitest";
import {
  groupBlocksBySection,
  isLandingBlockKind,
  isLandingSectionSlug,
  isSiteThemeKind,
  moveLandingBlock,
  normalizeBlockPositions,
  parseLandingBlocks,
  sanitizeLandingBlocksForPersistence,
} from "@/lib/cms/landingBlocksCatalog";
import {
  LANDING_BLOCKS_PER_SECTION_CAP,
  LANDING_BLOCKS_PER_TEMPLATE_CAP,
  type LandingBlock,
} from "@/types/theming";

describe("type guards", () => {
  it("isLandingBlockKind only accepts catalog values", () => {
    expect(isLandingBlockKind("card")).toBe(true);
    expect(isLandingBlockKind("callout")).toBe(true);
    expect(isLandingBlockKind("quote")).toBe(true);
    expect(isLandingBlockKind("feature")).toBe(true);
    expect(isLandingBlockKind("stat")).toBe(true);
    expect(isLandingBlockKind("cta")).toBe(true);
    expect(isLandingBlockKind("divider")).toBe(true);
    expect(isLandingBlockKind("video")).toBe(false);
    expect(isLandingBlockKind(undefined)).toBe(false);
  });

  it("isLandingSectionSlug only accepts canonical sections", () => {
    expect(isLandingSectionSlug("modalidades")).toBe(true);
    expect(isLandingSectionSlug("inicio")).toBe(true);
    expect(isLandingSectionSlug("hero")).toBe(false);
  });

  it("isSiteThemeKind only accepts the v1 enum values", () => {
    expect(isSiteThemeKind("classic")).toBe(true);
    expect(isSiteThemeKind("editorial")).toBe(true);
    expect(isSiteThemeKind("brutalist")).toBe(false);
  });
});

describe("parseLandingBlocks", () => {
  it("returns [] for non-array input", () => {
    expect(parseLandingBlocks(null)).toEqual([]);
    expect(parseLandingBlocks({})).toEqual([]);
    expect(parseLandingBlocks("[]")).toEqual([]);
  });

  it("drops entries with invalid id, section, kind or no copy", () => {
    const raw = [
      null,
      { id: "", section: "modalidades", kind: "card", copy: { es: { title: "x" }, en: {} } },
      { id: "a", section: "unknown", kind: "card", copy: { es: { title: "x" }, en: {} } },
      { id: "b", section: "modalidades", kind: "video", copy: { es: { title: "x" }, en: {} } },
      { id: "c", section: "modalidades", kind: "card", copy: { es: {}, en: {} } },
      { id: "d", section: "modalidades", kind: "card", copy: { es: { title: "ok" }, en: {} }, position: 1 },
    ];
    const blocks = parseLandingBlocks(raw);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].id).toBe("d");
    expect(blocks[0].position).toBe(0);
  });

  it("clamps oversize strings and preserves trimmed values", () => {
    const longTitle = "x".repeat(500);
    const blocks = parseLandingBlocks([
      {
        id: "a",
        section: "inicio",
        kind: "callout",
        copy: { es: { title: `  ${longTitle}  ` }, en: { body: " hi " } },
      },
    ]);
    expect(blocks[0].copy.es.title?.length).toBe(120);
    expect(blocks[0].copy.en.body).toBe("hi");
  });

  it("ignores oversize media paths", () => {
    const blocks = parseLandingBlocks([
      {
        id: "a",
        section: "inicio",
        kind: "card",
        copy: { es: { title: "x" }, en: {} },
        mediaPath: "x".repeat(300),
      },
      {
        id: "b",
        section: "inicio",
        kind: "card",
        copy: { es: { title: "y" }, en: {} },
        mediaPath: "themes/abc/blocks/img.png",
      },
    ]);
    expect(blocks.find((b) => b.id === "a")?.mediaPath).toBeUndefined();
    expect(blocks.find((b) => b.id === "b")?.mediaPath).toBe(
      "themes/abc/blocks/img.png",
    );
  });
});

describe("normalizeBlockPositions", () => {
  it("re-numbers per section starting at 0 keeping relative order", () => {
    const input: LandingBlock[] = [
      { id: "a", section: "modalidades", kind: "card", position: 7, copy: { es: { title: "1" }, en: {} } },
      { id: "b", section: "modalidades", kind: "card", position: 2, copy: { es: { title: "2" }, en: {} } },
      { id: "c", section: "inicio", kind: "callout", position: 5, copy: { es: { title: "i" }, en: {} } },
    ];
    const out = normalizeBlockPositions(input);
    const inicio = out.filter((b) => b.section === "inicio");
    const modal = out.filter((b) => b.section === "modalidades");
    expect(inicio.map((b) => [b.id, b.position])).toEqual([["c", 0]]);
    expect(modal.map((b) => [b.id, b.position])).toEqual([
      ["b", 0],
      ["a", 1],
    ]);
  });
});

describe("groupBlocksBySection", () => {
  it("returns one entry per canonical section, ordered by position", () => {
    const grouped = groupBlocksBySection([
      { id: "a", section: "modalidades", kind: "card", position: 1, copy: { es: { title: "1" }, en: {} } },
      { id: "b", section: "modalidades", kind: "card", position: 0, copy: { es: { title: "2" }, en: {} } },
    ]);
    expect(grouped.modalidades.map((b) => b.id)).toEqual(["b", "a"]);
    expect(grouped.inicio).toEqual([]);
    expect(grouped.certificaciones).toEqual([]);
  });
});

describe("sanitizeLandingBlocksForPersistence", () => {
  function block(id: string, section: LandingBlock["section"]): LandingBlock {
    return {
      id,
      section,
      kind: "card",
      position: 0,
      copy: { es: { title: id }, en: {} },
    };
  }

  it("returns ok with normalized blocks for valid input", () => {
    const out = sanitizeLandingBlocksForPersistence([
      block("a", "modalidades"),
      block("b", "modalidades"),
    ]);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.blocks.map((b) => b.position)).toEqual([0, 1]);
    }
  });

  it("rejects when the per-template cap is exceeded", () => {
    const many = Array.from({ length: LANDING_BLOCKS_PER_TEMPLATE_CAP + 1 }, (_, i) =>
      block(`b${i}`, i % 2 === 0 ? "inicio" : "historia"),
    );
    const out = sanitizeLandingBlocksForPersistence(many);
    expect(out).toEqual({ ok: false, reason: "too_many_total" });
  });

  it("rejects when one section busts its own cap", () => {
    const many = Array.from(
      { length: LANDING_BLOCKS_PER_SECTION_CAP + 1 },
      (_, i) => block(`b${i}`, "modalidades"),
    );
    const out = sanitizeLandingBlocksForPersistence(many);
    expect(out).toEqual({
      ok: false,
      reason: "too_many_in_section",
      section: "modalidades",
    });
  });
});

describe("moveLandingBlock", () => {
  function blk(
    id: string,
    section: LandingBlock["section"],
    position: number,
  ): LandingBlock {
    return {
      id,
      section,
      kind: "card",
      position,
      copy: { es: { title: id }, en: {} },
    };
  }

  it("moves a block one step up inside its section", () => {
    const list = [
      blk("a", "modalidades", 0),
      blk("b", "modalidades", 1),
      blk("c", "modalidades", 2),
    ];
    const next = moveLandingBlock(list, "c", -1);
    expect(next.map((b) => b.id)).toEqual(["a", "c", "b"]);
    expect(next.map((b) => b.position)).toEqual([0, 1, 2]);
  });

  it("moves a block one step down inside its section", () => {
    const list = [
      blk("a", "modalidades", 0),
      blk("b", "modalidades", 1),
      blk("c", "modalidades", 2),
    ];
    const next = moveLandingBlock(list, "a", 1);
    expect(next.map((b) => b.id)).toEqual(["b", "a", "c"]);
  });

  it("is a no-op at the top boundary", () => {
    const list = [
      blk("a", "modalidades", 0),
      blk("b", "modalidades", 1),
    ];
    const next = moveLandingBlock(list, "a", -1);
    expect(next.map((b) => b.id)).toEqual(["a", "b"]);
  });

  it("is a no-op at the bottom boundary", () => {
    const list = [
      blk("a", "modalidades", 0),
      blk("b", "modalidades", 1),
    ];
    const next = moveLandingBlock(list, "b", 1);
    expect(next.map((b) => b.id)).toEqual(["a", "b"]);
  });

  it("never crosses section boundaries", () => {
    const list = [
      blk("a", "inicio", 0),
      blk("b", "modalidades", 0),
      blk("c", "modalidades", 1),
    ];
    // "b" cannot move up across section to "inicio"; should stay at top of modalidades
    const next = moveLandingBlock(list, "b", -1);
    const modalidades = next.filter((b) => b.section === "modalidades");
    expect(modalidades.map((b) => b.id)).toEqual(["b", "c"]);
    expect(next.find((b) => b.id === "a")?.section).toBe("inicio");
  });

  it("returns the normalized list when the target id is missing", () => {
    const list = [blk("a", "inicio", 0), blk("b", "inicio", 5)];
    const next = moveLandingBlock(list, "missing", 1);
    expect(next.map((b) => b.position)).toEqual([0, 1]);
  });
});

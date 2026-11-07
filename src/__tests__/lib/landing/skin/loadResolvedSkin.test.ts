import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import { buildResolvedSkin } from "@/lib/landing/skin/loadResolvedSkin";
import type { Dictionary } from "@/types/i18n";

// REGRESSION CHECK: owner text written under another kind must survive a skin change.
// Changing the merge order in buildResolvedSkin may drop legacy owner text or let
// stored skin_content lose to defaults.
describe("buildResolvedSkin", () => {
  it("shows legacy owner text after a switch to another skin", () => {
    const skin = buildResolvedSkin({
      dict: es as unknown as Dictionary,
      kind: "musica",
      content: { inicio: { "genericLandings.deportes.title": { es: "Club Norte" } } },
      skinContent: { v: 1, sections: {} },
      locale: "es",
    });
    expect(skin.inicio.title).toBe("Club Norte");
  });

  it("uses the new skin default where the owner wrote nothing", () => {
    const skin = buildResolvedSkin({
      dict: es as unknown as Dictionary,
      kind: "musica",
      content: null,
      skinContent: { v: 1, sections: {} },
      locale: "es",
    });
    expect(skin.inicio.title).toBe((es as unknown as Dictionary).landing.skins.musica.inicio.title);
  });
});

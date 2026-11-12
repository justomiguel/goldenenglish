import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import { GENERIC_INSTITUTE_KINDS } from "@/lib/theme/genericInstituteTemplates";
import { legacyThemeToDocument } from "@/lib/theme-document/legacyThemeToDocument";
import { starterDocument } from "@/lib/theme-document/starterDocument";
import { validateThemeDocument } from "@/lib/theme-document/validateThemeDocument";
import type { Dictionary } from "@/types/i18n";

const dict = es as Dictionary;

describe("starterDocument", () => {
  it("matches the legacy document for each generic kind and validates", () => {
    for (const kind of GENERIC_INSTITUTE_KINDS) {
      const doc = starterDocument(kind, dict, "es");
      expect(doc).toEqual(
        legacyThemeToDocument(
          { properties: {}, skin_content: null, template_kind: kind },
          { dict, locale: "es" },
        ),
      );
      expect(validateThemeDocument(doc, null)).toEqual({ ok: true });
    }
  });
});

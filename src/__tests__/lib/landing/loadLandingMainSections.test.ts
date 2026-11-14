import { describe, it, expect, vi } from "vitest";
import { SITE_THEME_KINDS } from "@/types/theming";

function stub(name: string) {
  const Comp = () => null;
  Object.defineProperty(Comp, "name", { value: name });
  return Comp;
}

vi.mock("@/components/organisms/LandingMainSections", () => ({
  LandingMainSections: stub("LandingMainSections"),
}));
vi.mock("@/components/organisms/LandingMainSectionsEditorial", () => ({
  LandingMainSectionsEditorial: stub("LandingMainSectionsEditorial"),
}));
vi.mock("@/components/organisms/LandingMainSectionsMinimal", () => ({
  LandingMainSectionsMinimal: stub("LandingMainSectionsMinimal"),
}));
vi.mock("@/variants/owned/mozarthitos/pieces/LandingMainSectionsMozarthitos", () => ({
  LandingMainSectionsMozarthitos: stub("LandingMainSectionsMozarthitos"),
}));
vi.mock("@/variants/owned/espaciozenit/pieces/LandingMainSectionsEspacioZenit", () => ({
  LandingMainSectionsEspacioZenit: stub("LandingMainSectionsEspacioZenit"),
}));
vi.mock("@/variants/owned/nago/pieces/LandingMainSectionsNago", () => ({
  LandingMainSectionsNago: stub("LandingMainSectionsNago"),
}));
vi.mock("@/variants/owned/mimundo/pieces/LandingMainSectionsMimundo", () => ({
  LandingMainSectionsMimundo: stub("LandingMainSectionsMimundo"),
}));
vi.mock("@/variants/owned/liora/pieces/LandingMainSectionsLiora", () => ({
  LandingMainSectionsLiora: stub("LandingMainSectionsLiora"),
}));
vi.mock("@/variants/owned/matiss/pieces/LandingMainSectionsMatiss", () => ({
  LandingMainSectionsMatiss: stub("LandingMainSectionsMatiss"),
}));
vi.mock("@/components/organisms/LandingMainSectionsGeneric", () => ({
  LandingMainSectionsGeneric: stub("LandingMainSectionsGeneric"),
}));

import { loadLandingMainSections } from "@/lib/landing/loadLandingMainSections";

const EXPECTED_NAME: Record<(typeof SITE_THEME_KINDS)[number], string> = {
  classic: "LandingMainSections",
  editorial: "LandingMainSectionsEditorial",
  minimal: "LandingMainSectionsMinimal",
  mozarthitos: "LandingMainSectionsMozarthitos",
  espaciozenit: "LandingMainSectionsEspacioZenit",
  nago: "LandingMainSectionsNago",
  mimundo: "LandingMainSectionsMimundo",
  liora: "LandingMainSectionsLiora",
  matiss: "LandingMainSectionsMatiss",
  deportes: "LandingMainSectionsGenericBound",
  jardin: "LandingMainSectionsGenericBound",
  colegio: "LandingMainSectionsGenericBound",
  musica: "LandingMainSectionsGenericBound",
  idiomas: "LandingMainSectionsGenericBound",
  deportes2: "DeportesDosLanding",
  jardin2: "JardinDosLanding",
  colegio2: "ColegioDosLanding",
  idiomas2: "IdiomasDosLanding",
  musica2: "MusicaDosLanding",
};

describe("loadLandingMainSections", () => {
  it.each(SITE_THEME_KINDS)(
    "returns the %s landing organism via dynamic import",
    async (kind) => {
      const Component = await loadLandingMainSections(kind);
      expect(typeof Component).toBe("function");
      expect(Component.name).toBe(EXPECTED_NAME[kind]);
    },
  );
});

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
vi.mock("@/components/organisms/LandingMainSectionsMozarthitos", () => ({
  LandingMainSectionsMozarthitos: stub("LandingMainSectionsMozarthitos"),
}));
vi.mock("@/components/organisms/LandingMainSectionsEspacioZenit", () => ({
  LandingMainSectionsEspacioZenit: stub("LandingMainSectionsEspacioZenit"),
}));
vi.mock("@/components/organisms/LandingMainSectionsNago", () => ({
  LandingMainSectionsNago: stub("LandingMainSectionsNago"),
}));
vi.mock("@/components/organisms/LandingMainSectionsMimundo", () => ({
  LandingMainSectionsMimundo: stub("LandingMainSectionsMimundo"),
}));
vi.mock("@/components/organisms/LandingMainSectionsLiora", () => ({
  LandingMainSectionsLiora: stub("LandingMainSectionsLiora"),
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

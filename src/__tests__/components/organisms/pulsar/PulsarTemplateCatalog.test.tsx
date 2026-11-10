import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PulsarTemplateCatalog } from "@/components/organisms/pulsar/PulsarTemplateCatalog";
import es from "@/dictionaries/es.json";
import { buildPulsarTemplateCatalogCards } from "@/lib/pulsar/pulsarTemplateCatalog";
import { isExclusiveThemeKind } from "@/lib/theme/exclusiveThemeKinds";
import { GENERIC_INSTITUTE_KINDS } from "@/lib/theme/genericInstituteTemplates";
import type { Dictionary } from "@/types/i18n";

// REGRESSION CHECK: The staff catalog must list every generic kind and link to /plantilla/{kind}.

const dict = es as unknown as Dictionary;

describe("PulsarTemplateCatalog", () => {
  const cards = buildPulsarTemplateCatalogCards({
    locale: "es",
    names: dict.pulsar.solutionSet.presencia.templateKinds,
    openLabel: dict.pulsar.admin.templatesOpen,
  });

  it("shows every client template with a live preview link", () => {
    render(
      <PulsarTemplateCatalog
        title={dict.pulsar.admin.templatesTitle}
        lead={dict.pulsar.admin.templatesLead}
        cards={cards}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Plantillas" })).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(GENERIC_INSTITUTE_KINDS.length);
    for (const kind of GENERIC_INSTITUTE_KINDS) {
      const name = dict.pulsar.solutionSet.presencia.templateKinds[kind];
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
      const link = screen.getByRole("link", { name: `Abrir ${name}` });
      expect(link).toHaveAttribute("href", expect.stringContaining(`/es/plantilla/${kind}`));
      expect(isExclusiveThemeKind(kind)).toBe(false);
    }
  });
});

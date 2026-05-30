import { describe, expect, it } from "vitest";
import { pickBlogMaterialsPanelLabels } from "@/lib/blog/pickBlogMaterialsPanelLabels";

const academic = {
  draftMaterialsTitle: "Materiales en borrador",
  draftMaterialsLead: "Lead académico",
  materialLabelPlaceholder: "Academic label",
  embedUrlPlaceholder: "Academic embed",
  builderAddEmbed: "Agregar embed al borrador",
  builderFileLabel: "Subir archivos al borrador",
  builderFileHint: "Hint académico",
  noMaterialsDraft: "Sin borrador",
  dragMaterial: "Arrastrar",
  dragHandle: "::",
  embedKind: "Embed",
  fileKind: "Archivo",
  moveUp: "Subir",
  moveDown: "Bajar",
  remove: "Quitar",
} as const;

const blogMaterials = {
  title: "Archivos y medios adjuntos",
  lead: "Lead blog",
  materialLabelPlaceholder: "Nombre visible",
  embedUrlPlaceholder: "URL video",
  addEmbed: "Agregar video embebido",
  uploadFiles: "Subir archivos",
  uploadFilesHint: "Hint blog",
  empty: "Sin adjuntos",
};

describe("pickBlogMaterialsPanelLabels", () => {
  it("uses blog copy for section title and actions", () => {
    const labels = pickBlogMaterialsPanelLabels(
      academic as Parameters<typeof pickBlogMaterialsPanelLabels>[0],
      blogMaterials,
    );
    expect(labels.draftMaterialsTitle).toBe("Archivos y medios adjuntos");
    expect(labels.builderAddEmbed).toBe("Agregar video embebido");
    expect(labels.noMaterialsDraft).toBe("Sin adjuntos");
    expect(labels.moveUp).toBe("Subir");
  });
});

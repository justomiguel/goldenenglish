import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BlogArticleMaterialsSection } from "@/components/dashboard/admin/cms/blog/BlogArticleMaterialsSection";
import type { ContentMaterialsPanelLabels } from "@/types/contentMaterialsPanelLabels";
import { dictEn } from "@/test/dictEn";

vi.mock("@/app/[locale]/dashboard/admin/cms/blog/actions", () => ({
  cleanupBlogMediaPendingUploadAction: vi.fn(),
}));

const labels: ContentMaterialsPanelLabels = {
  draftMaterialsTitle: "Archivos y contenido embebido",
  draftMaterialsLead: "Lead de adjuntos",
  materialLabelPlaceholder: "Nombre visible",
  embedUrlPlaceholder: "URL embed",
  builderAddEmbed: "Agregar embed",
  builderFileLabel: "Subir archivos",
  builderFileHint: "Hasta 50 MB",
  noMaterialsDraft: "Todavía no hay adjuntos",
  dragMaterial: "Arrastrar",
  dragHandle: "::",
  embedKind: "Embed",
  fileKind: "Archivo",
  moveUp: "Subir",
  moveDown: "Bajar",
  remove: "Quitar",
};

const noop = {
  onMaterialsChange: vi.fn(),
  onUploadFiles: vi.fn(async () => []),
};

describe("BlogArticleMaterialsSection", () => {
  it("keeps the materials form behind a button when there are no attachments", async () => {
    const user = userEvent.setup();
    render(
      <BlogArticleMaterialsSection
        labels={labels}
        fileUploadProgress={dictEn.common.fileUpload}
        materials={[]}
        isUploading={false}
        onMaterialsChange={noop.onMaterialsChange}
        onUploadFiles={noop.onUploadFiles}
      />,
    );

    expect(screen.getByRole("button", { name: labels.draftMaterialsTitle })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText(labels.draftMaterialsLead)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.builderAddEmbed })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: labels.draftMaterialsTitle }));

    expect(screen.getByRole("button", { name: labels.draftMaterialsTitle })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText(labels.draftMaterialsLead)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.builderAddEmbed })).toBeInTheDocument();
  });

  it("starts open when the article already has attachments", () => {
    render(
      <BlogArticleMaterialsSection
        labels={labels}
        fileUploadProgress={dictEn.common.fileUpload}
        materials={[
          { id: "m1", kind: "embed", label: "Formulario", url: "https://example.com/form" },
        ]}
        isUploading={false}
        onMaterialsChange={noop.onMaterialsChange}
        onUploadFiles={noop.onUploadFiles}
      />,
    );

    expect(screen.getByRole("button", { name: /Archivos y contenido embebido/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Formulario")).toBeInTheDocument();
  });
});

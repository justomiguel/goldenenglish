// REGRESSION CHECK: An upload bar is absent until a file is read or sent, and it leaves when that work ends.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminGlobalContentMaterialsPanel } from "@/components/admin/AdminGlobalContentMaterialsPanel";
import { AcademicProfileValueRows } from "@/components/molecules/AcademicProfileValueRows";
import { EventRegisterCustomFileField } from "@/components/molecules/EventRegisterCustomFileField";
import { SectionReferenceImageField } from "@/components/molecules/SectionReferenceImageField";
import { EventRegisterTransferReceiptField } from "@/components/organisms/EventRegisterTransferReceiptField";
import type { AcademicProfileCardField } from "@/lib/academic-profile/academicProfileCard";
import { dictEn } from "@/test/dictEn";
import type { ContentMaterialsPanelLabels } from "@/types/contentMaterialsPanelLabels";
import type { Dictionary } from "@/types/i18n";

vi.mock("@/app/[locale]/dashboard/admin/users/academicProfileFileActions", () => ({
  prepareAcademicProfileFileUploadAction: vi.fn(),
}));

const fileField: AcademicProfileCardField = {
  id: "scan",
  label: "Scan",
  fieldType: "file",
  selectOptions: [],
  required: false,
  showInDirectory: false,
  valueText: null,
  valueNumber: null,
  valueDate: null,
  storagePath: null,
  fileUrl: null,
};

const materialLabels = {
  draftMaterialsTitle: "Files",
  draftMaterialsLead: "Lead",
  materialLabelPlaceholder: "Name",
  embedUrlPlaceholder: "URL",
  builderAddEmbed: "Add embed",
  builderFileLabel: "Upload files",
  builderFileHint: "Up to 50 MB",
  noMaterialsDraft: "No files",
  dragMaterial: "Drag",
  dragHandle: "::",
  embedKind: "Embed",
  fileKind: "File",
  moveUp: "Up",
  moveDown: "Down",
  remove: "Remove",
} satisfies ContentMaterialsPanelLabels;

function expectNoBar() {
  expect(screen.queryByRole("progressbar")).toBeNull();
}

describe("upload progress bar visibility", () => {
  it("hides the bar on idle file pickers and shows it while a photo sends", () => {
    const { rerender } = render(
      <EventRegisterCustomFileField
        field={{ id: "doc", fieldKey: "doc", fieldType: "file", labelI18n: { en: "Doc" }, required: false }}
        labels={{
          fileButton: "File",
          imageButton: "Image",
          noFile: "None",
          required: "Required",
          tooLarge: "Large",
          invalidType: "Type",
          fileInputAriaLabel: "File",
          imageInputAriaLabel: "Image",
        }}
        file={null}
        onFileChange={vi.fn()}
        onValidationError={vi.fn()}
      />,
    );
    expectNoBar();

    rerender(
      <EventRegisterTransferReceiptField
        labels={{
          title: "Receipt",
          button: "Choose",
          hint: "Hint",
          noFile: "None",
          required: "Required",
          tooLarge: "Large",
          invalidType: "Type",
          inputAriaLabel: "Receipt",
        }}
        file={null}
        onFileChange={vi.fn()}
        onValidationError={vi.fn()}
      />,
    );
    expectNoBar();

    rerender(
      <SectionReferenceImageField
        id="photo"
        file={null}
        onFileChange={vi.fn()}
        dict={{ photoLabel: "Photo", photoInvalid: "Invalid" }}
      />,
    );
    expectNoBar();

    rerender(
      <SectionReferenceImageField
        id="photo"
        file={null}
        onFileChange={vi.fn()}
        dict={{ photoLabel: "Photo", photoInvalid: "Invalid" }}
        progress={{ label: "Sending", indeterminate: true }}
      />,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("hides the bar on an idle file field and shows it while materials upload", () => {
    const { rerender } = render(
      <AcademicProfileValueRows
        fields={[fileField]}
        drafts={{ scan: { text: "", number: "", date: "", path: "" } }}
        labels={{} as Dictionary["admin"]["users"]["academicFields"]}
        editing
        studentId="student-1"
        onChange={vi.fn()}
        onError={vi.fn()}
      />,
    );
    expectNoBar();

    rerender(
      <AdminGlobalContentMaterialsPanel
        labels={materialLabels}
        materials={[]}
        materialLabel=""
        embedUrl=""
        isUploading={false}
        fileUploadProgress={dictEn.common.fileUpload}
        onMaterialLabelChange={vi.fn()}
        onEmbedUrlChange={vi.fn()}
        onAddEmbed={vi.fn()}
        onAddFiles={vi.fn()}
        onReorderMaterials={vi.fn()}
        onMoveMaterial={vi.fn()}
        onRemoveMaterial={vi.fn()}
      />,
    );
    expectNoBar();

    rerender(
      <AdminGlobalContentMaterialsPanel
        labels={materialLabels}
        materials={[]}
        materialLabel=""
        embedUrl=""
        isUploading
        fileUploadProgress={dictEn.common.fileUpload}
        onMaterialLabelChange={vi.fn()}
        onEmbedUrlChange={vi.fn()}
        onAddEmbed={vi.fn()}
        onAddFiles={vi.fn()}
        onReorderMaterials={vi.fn()}
        onMoveMaterial={vi.fn()}
        onRemoveMaterial={vi.fn()}
      />,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

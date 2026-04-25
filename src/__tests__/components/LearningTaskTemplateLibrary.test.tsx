/**
 * REGRESSION CHECK: template media uploads must reject oversized files in the
 * browser before any server action or storage upload is attempted.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LearningTaskTemplateLibrary } from "@/components/teacher/LearningTaskTemplateLibrary";

const uploadTemplateFileAction = vi.fn();

vi.mock("@/components/molecules/RichTextEditor", () => ({
  RichTextEditor: () => <div data-testid="rich-editor" />,
}));

vi.mock("@/app/[locale]/dashboard/teacher/tasks/actions", () => ({
  addTemplateEmbedAction: vi.fn(),
  saveContentTemplateAction: vi.fn(),
  uploadTemplateFileAction: (...args: unknown[]) => uploadTemplateFileAction(...args),
}));

const labels = {
  taskLibraryTitle: "Master classes",
  taskLibraryLead: "Create templates",
  taskTemplateTitleLabel: "Template title",
  taskTemplateBodyLabel: "Lesson body",
  taskTemplateSave: "Save template",
  taskTemplateEmpty: "No templates yet.",
  taskTemplateAssetTitle: "Template media",
  taskTemplateAssetLabel: "Asset label",
  taskTemplateAssetFile: "PDF, image, or video file (max 50 MB)",
  taskTemplateAssetUpload: "Upload file",
  taskTemplateEmbedUrl: "YouTube or Vimeo URL",
  taskTemplateEmbedAdd: "Add video",
  taskTemplateAssetTooLarge: "The file is larger than 50 MB.",
  taskAssignTitle: "Assign to section",
  taskAssignStart: "Opening date",
  taskAssignDue: "Due date",
  taskAssignButton: "Assign",
} as never;

describe("LearningTaskTemplateLibrary", () => {
  it("blocks a 51MB upload before calling the server", async () => {
    const user = userEvent.setup();
    render(
      <LearningTaskTemplateLibrary
        locale="en"
        labels={labels}
        templates={[{ id: "template-1", title: "Lesson", updatedAt: "2026-04-20T00:00:00Z", assetCount: 0 }]}
      />,
    );

    await user.type(screen.getByLabelText("Asset label"), "Guide");
    const file = new File(["x"], "large.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "size", { value: 51 * 1024 * 1024 });
    await user.upload(screen.getByLabelText("PDF, image, or video file (max 50 MB)"), file);

    expect(screen.getByText("The file is larger than 50 MB.")).toBeInTheDocument();
    expect(uploadTemplateFileAction).not.toHaveBeenCalled();
  });
});

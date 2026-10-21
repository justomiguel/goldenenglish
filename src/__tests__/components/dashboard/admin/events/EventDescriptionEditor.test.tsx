import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EventDescriptionEditor } from "@/components/dashboard/admin/events/EventDescriptionEditor";
import en from "@/dictionaries/en.json";

const performEventMediaFileUpload = vi.hoisted(() => vi.fn());

vi.mock("@/components/dashboard/admin/events/performEventMediaFileUpload", () => ({
  performEventMediaFileUpload: (...args: unknown[]) => performEventMediaFileUpload(...args),
}));

vi.mock("@/components/admin/AcademicContentEditor", () => ({
  AcademicContentEditor: ({
    onImageUpload,
  }: {
    onImageUpload: (file: File) => Promise<unknown>;
  }) => (
    <button
      type="button"
      onClick={() =>
        void onImageUpload(new File([new Uint8Array(4)], "cover.jpg", { type: "image/jpeg" }))
      }
    >
      Add image
    </button>
  ),
}));

vi.mock("@/lib/supabase/publicEnv", () => ({
  readSupabasePublicEnv: () => ({ url: "https://proj.supabase.co", anonKey: "anon" }),
}));

describe("EventDescriptionEditor upload progress", () => {
  it("shows the upload modal while the image is in flight, then hides it", async () => {
    let resolveUpload: (value: { storagePath: string } | null) => void = () => undefined;
    performEventMediaFileUpload.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
    );
    const user = userEvent.setup();
    render(
      <EventDescriptionEditor
        descriptionLabel="Description"
        editorLabels={en.admin.cms.blog.editor}
        academicLabels={en.dashboard.adminContents}
        fileUploadProgress={en.common.fileUpload}
        descriptionHtml="<p></p>"
        onDescriptionHtmlChange={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add image" }));
    expect(await screen.findByText(en.common.fileUpload.modalTitle)).toBeInTheDocument();
    expect(screen.getByText("cover.jpg")).toBeInTheDocument();

    resolveUpload({ storagePath: "events/evt/cover.jpg" });
    await waitFor(() => {
      expect(screen.queryByText(en.common.fileUpload.modalTitle)).not.toBeInTheDocument();
    });
  });
});

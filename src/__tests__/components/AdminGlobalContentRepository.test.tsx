import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminGlobalContentRepository } from "@/components/admin/AdminGlobalContentRepository";
import { AdminGlobalContentBuilder } from "@/components/admin/AdminGlobalContentBuilder";
import { dictEn } from "@/test/dictEn";

const prepareGlobalContentFileUploadAction = vi.fn(async () => ({
  ok: true,
  assetId: "00000000-0000-4000-8000-000000000010",
  storagePath: "templates/admin/asset/intro.mp4",
  token: "signed-token",
}));
const saveGlobalContentBuilderMetadataAction = vi.fn(async () => ({ ok: true, id: "content-1" }));
const deleteGlobalContentAction = vi.fn(async () => ({ ok: true, id: "content-1" }));
const uploadToSignedUrl = vi.fn(async () => ({ data: {}, error: null }));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/admin/AcademicContentEditor", () => ({
  AcademicContentEditor: ({ onChange }: { onChange: (html: string) => void }) => (
    <button type="button" data-testid="rich-editor" onClick={() => onChange("<p>Edited body</p>")}>
      Editor
    </button>
  ),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/contents/globalContentBuilderActions", () => ({
  archiveGlobalContentAction: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/contents/globalContentFormDataActions", () => ({
  cleanupGlobalContentPendingUploadAction: vi.fn(),
  prepareGlobalContentFileUploadAction: (...args: unknown[]) => prepareGlobalContentFileUploadAction(...args),
  saveGlobalContentBuilderMetadataAction: (...args: unknown[]) => saveGlobalContentBuilderMetadataAction(...args),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/contents/globalContentLifecycleActions", () => ({
  deleteGlobalContentAction: (...args: unknown[]) => deleteGlobalContentAction(...args),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({ uploadToSignedUrl }),
    },
  }),
}));

const defaultPagination = { page: 1, pageSize: 20, totalCount: 0, searchQuery: "" };

describe("AdminGlobalContentRepository", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();
    mockRefresh.mockClear();
    prepareGlobalContentFileUploadAction.mockClear();
    saveGlobalContentBuilderMetadataAction.mockClear();
    deleteGlobalContentAction.mockClear();
    uploadToSignedUrl.mockClear();
  });

  it("links creation to a full-page editor", () => {
    const labels = dictEn.dashboard.adminContents;

    render(
      <AdminGlobalContentRepository
        locale="en"
        labels={labels}
        contents={[]}
        pagination={defaultPagination}
      />,
    );

    expect(screen.getByRole("link", { name: labels.globalNewPageCta })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/academic/contents/global/new",
    );
  });

  it("links existing content to a read-only detail page", () => {
    const labels = dictEn.dashboard.adminContents;

    render(
      <AdminGlobalContentRepository
        locale="en"
        labels={labels}
        pagination={{ ...defaultPagination, totalCount: 1 }}
        contents={[{
          id: "00000000-0000-4000-8000-000000000001",
          title: "Saved content",
          description: "",
          bodyHtml: "<p>Body</p>",
          updatedAt: "2026-04-20T00:00:00Z",
          assetCount: 0,
          blockCount: 1,
          assets: [],
          blocks: [],
        }]}
      />,
    );

    expect(screen.getByRole("link", { name: labels.view })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/academic/contents/global/00000000-0000-4000-8000-000000000001",
    );
  });

  it("shows attachment type chips with counts from draft assets", () => {
    const labels = dictEn.dashboard.adminContents;
    const audioLabel = labels.repositoryChipAudio.replace("{count}", "3");

    render(
      <AdminGlobalContentRepository
        locale="en"
        labels={labels}
        pagination={{ ...defaultPagination, totalCount: 1 }}
        contents={[{
          id: "00000000-0000-4000-8000-000000000001",
          title: "Lesson with media",
          description: "",
          bodyHtml: "<p></p>",
          updatedAt: "2026-04-20T00:00:00Z",
          assetCount: 4,
          blockCount: 0,
          assets: [
            { id: "a1", label: "t1", kind: "file", mimeType: "audio/mpeg", embedUrl: null, storagePath: "p1" },
            { id: "a2", label: "t2", kind: "file", mimeType: "audio/mpeg", embedUrl: null, storagePath: "p2" },
            { id: "a3", label: "t3", kind: "file", mimeType: "audio/mpeg", embedUrl: null, storagePath: "p3" },
            { id: "p1", label: "h", kind: "file", mimeType: "application/pdf", embedUrl: null, storagePath: "p4" },
          ],
          blocks: [],
        }]}
      />,
    );

    expect(screen.getByText(audioLabel)).toBeInTheDocument();
    expect(screen.getByText(labels.repositoryChipPdf.replace("{count}", "1"))).toBeInTheDocument();
  });
});

describe("AdminGlobalContentBuilder", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    prepareGlobalContentFileUploadAction.mockClear();
    saveGlobalContentBuilderMetadataAction.mockClear();
    uploadToSignedUrl.mockClear();
  });

  it("lets admins add and remove materials before saving content", async () => {
    const user = userEvent.setup();
    const labels = dictEn.dashboard.adminContents;

    render(
      <AdminGlobalContentBuilder
        locale="en"
        labels={labels}
        editingContent={null}
      />,
    );

    await user.type(screen.getByLabelText(new RegExp(labels.globalTitleLabel)), "Pronunciation workshop");
    await user.type(screen.getByPlaceholderText(labels.materialLabelPlaceholder), "Warm-up video");
    await user.type(screen.getByPlaceholderText(labels.embedUrlPlaceholder), "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await user.click(screen.getByRole("button", { name: labels.builderAddEmbed }));

    expect(screen.getByText("Warm-up video")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.dragMaterial })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: labels.remove }));
    expect(screen.queryByText("Warm-up video")).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(labels.materialLabelPlaceholder), "Main video");
    await user.clear(screen.getByPlaceholderText(labels.embedUrlPlaceholder));
    await user.type(screen.getByPlaceholderText(labels.embedUrlPlaceholder), "https://vimeo.com/123456");
    await user.click(screen.getByRole("button", { name: labels.builderAddEmbed }));
    await user.click(screen.getByRole("button", { name: labels.globalSave }));

    const payload = saveGlobalContentBuilderMetadataAction.mock.calls[0][0];
    expect(payload).toEqual(expect.objectContaining({
      title: "Pronunciation workshop",
      materials: [expect.objectContaining({ label: "Main video", kind: "embed", sortOrder: 0 })],
    }));
  });

  it("lets admins pick audiovisual files before typing a material label", async () => {
    const user = userEvent.setup();
    const labels = dictEn.dashboard.adminContents;

    render(
      <AdminGlobalContentBuilder
        locale="en"
        labels={labels}
        editingContent={null}
      />,
    );

    const file = new File(["audio"], "listening-practice.mp3", { type: "audio/mpeg" });
    await user.upload(screen.getByLabelText(labels.builderFileLabel), file);

    expect(screen.getByText("listening-practice")).toBeInTheDocument();
    expect(screen.getByText("listening-practice.mp3")).toBeInTheDocument();
  });

  it("accepts video files as draft materials without requiring a label first", async () => {
    const user = userEvent.setup();
    const labels = dictEn.dashboard.adminContents;

    render(
      <AdminGlobalContentBuilder
        locale="en"
        labels={labels}
        editingContent={null}
      />,
    );

    const file = new File(["video"], "class-intro.mp4", { type: "video/mp4" });
    await user.upload(screen.getByLabelText(labels.builderFileLabel), file);

    expect(screen.getByText("class-intro")).toBeInTheDocument();
    expect(screen.getByText("class-intro.mp4")).toBeInTheDocument();
  });

  it("accepts Office files as draft materials", async () => {
    const user = userEvent.setup();
    const labels = dictEn.dashboard.adminContents;

    render(
      <AdminGlobalContentBuilder
        locale="en"
        labels={labels}
        editingContent={null}
      />,
    );

    const file = new File(["doc"], "lesson-plan.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    await user.upload(screen.getByLabelText(labels.builderFileLabel), file);

    expect(screen.getByText("lesson-plan")).toBeInTheDocument();
    expect(screen.getByText("lesson-plan.docx")).toBeInTheDocument();
  });

  it("uploads files directly to storage and saves metadata only", async () => {
    const user = userEvent.setup();
    const labels = dictEn.dashboard.adminContents;

    render(
      <AdminGlobalContentBuilder
        locale="en"
        labels={labels}
        editingContent={null}
      />,
    );

    await user.type(screen.getByLabelText(new RegExp(labels.globalTitleLabel)), "Video lesson");
    await user.upload(screen.getByLabelText(labels.builderFileLabel), new File(["video"], "intro.mp4", { type: "video/mp4" }));
    await user.click(screen.getByRole("button", { name: labels.globalSave }));

    expect(prepareGlobalContentFileUploadAction).toHaveBeenCalledWith({
      filename: "intro.mp4",
      contentType: "video/mp4",
      byteSize: 5,
    });
    expect(uploadToSignedUrl).toHaveBeenCalledWith(
      "templates/admin/asset/intro.mp4",
      "signed-token",
      expect.any(File),
    );
    const payload = saveGlobalContentBuilderMetadataAction.mock.calls[0][0];
    expect(payload.materials[0]).toEqual(expect.objectContaining({
      uploadedAssetId: "00000000-0000-4000-8000-000000000010",
      storagePath: "templates/admin/asset/intro.mp4",
      filename: "intro.mp4",
      contentType: "video/mp4",
      byteSize: 5,
    }));
    expect(JSON.stringify(payload)).not.toContain("fileBase64");
  });

  it("saves the reordered draft material order", async () => {
    const user = userEvent.setup();
    const labels = dictEn.dashboard.adminContents;

    render(
      <AdminGlobalContentBuilder
        locale="en"
        labels={labels}
        editingContent={null}
      />,
    );

    await user.type(screen.getByLabelText(new RegExp(labels.globalTitleLabel)), "Ordered lesson");
    await user.type(screen.getByPlaceholderText(labels.materialLabelPlaceholder), "First");
    await user.type(screen.getByPlaceholderText(labels.embedUrlPlaceholder), "https://vimeo.com/111111");
    await user.click(screen.getByRole("button", { name: labels.builderAddEmbed }));
    await user.type(screen.getByPlaceholderText(labels.materialLabelPlaceholder), "Second");
    await user.clear(screen.getByPlaceholderText(labels.embedUrlPlaceholder));
    await user.type(screen.getByPlaceholderText(labels.embedUrlPlaceholder), "https://vimeo.com/222222");
    await user.click(screen.getByRole("button", { name: labels.builderAddEmbed }));
    await user.click(screen.getAllByRole("button", { name: labels.moveUp })[1]);
    await user.click(screen.getByRole("button", { name: labels.globalSave }));

    const payload = saveGlobalContentBuilderMetadataAction.mock.calls[0][0];
    expect(payload.materials).toEqual([
      expect.objectContaining({ label: "Second", sortOrder: 0 }),
      expect.objectContaining({ label: "First", sortOrder: 1 }),
    ]);
  });

  it("offers a permanent delete action alongside archive", async () => {
    const user = userEvent.setup();
    const labels = dictEn.dashboard.adminContents;
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <AdminGlobalContentRepository
        locale="en"
        labels={labels}
        pagination={{ ...defaultPagination, totalCount: 1 }}
        contents={[{
          id: "00000000-0000-4000-8000-000000000001",
          title: "Saved content",
          description: "",
          bodyHtml: "<p>Body</p>",
          updatedAt: "2026-04-20T00:00:00Z",
          assetCount: 0,
          blockCount: 1,
          assets: [],
          blocks: [],
        }]}
      />,
    );

    expect(screen.getByRole("button", { name: labels.archive })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.delete }));

    expect(deleteGlobalContentAction).toHaveBeenCalledWith({
      locale: "en",
      id: "00000000-0000-4000-8000-000000000001",
    });
  });
});

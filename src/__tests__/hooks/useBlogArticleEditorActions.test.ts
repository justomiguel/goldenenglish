import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBlogArticleEditorActions } from "@/hooks/useBlogArticleEditorActions";
import { dictEn } from "@/test/dictEn";

const saveBlogArticleAdminAction = vi.fn();
const onStatusSaved = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/cms/blog/actions", () => ({
  saveBlogArticleAdminAction: (...args: unknown[]) => saveBlogArticleAdminAction(...args),
  deleteBlogArticleAdminAction: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/cms/blog/blogTranslateAdminActions", () => ({
  translateBlogArticleFieldsAdminAction: vi.fn(),
}));

const labels = dictEn.admin.cms.blog.editor;

function hookInput() {
  return {
    locale: "es",
    labels,
    initial: { defaultLocale: "es" as const, hasGoogleKey: false },
    status: "draft",
    tags: [] as string[],
    isPinned: false,
    scheduledFor: "",
    editingLocale: "es" as const,
    title: "Hola",
    excerpt: "",
    bodyHtml: "<p>Cuerpo</p>",
    savableTranslations: [
      {
        locale: "es" as const,
        slug: "hola",
        title: "Hola",
        excerpt: "",
        bodyHtml: "<p>Cuerpo</p>",
        materials: [],
      },
    ],
    applyTranslatedLocale: vi.fn(),
    draftMaterialsToBlogAttachments: () => [],
    initialShareLinks: [],
    onStatusSaved,
  };
}

describe("useBlogArticleEditorActions", () => {
  beforeEach(() => {
    saveBlogArticleAdminAction.mockReset();
    onStatusSaved.mockReset();
    saveBlogArticleAdminAction.mockResolvedValue({ ok: true, articleId: "art-1" });
  });

  it("saves as draft and publishes with status published", async () => {
    const { result } = renderHook(() => useBlogArticleEditorActions(hookInput()));

    await act(async () => {
      await result.current.onSaveDraft();
    });
    expect(saveBlogArticleAdminAction).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ status: "draft" }),
      }),
    );
    expect(onStatusSaved).toHaveBeenCalledWith("draft");
    expect(result.current.msg).toBe(labels.saveSuccess);

    await act(async () => {
      await result.current.onPublish();
    });
    expect(saveBlogArticleAdminAction).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ status: "published" }),
      }),
    );
    expect(onStatusSaved).toHaveBeenCalledWith("published");
    expect(result.current.msg).toBe(labels.publishSuccess);
  });
});

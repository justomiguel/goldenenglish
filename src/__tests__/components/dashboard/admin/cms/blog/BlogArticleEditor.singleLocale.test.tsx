import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlogArticleEditor } from "@/components/dashboard/admin/cms/blog/BlogArticleEditor";
import { dictEn } from "@/test/dictEn";

const labels = dictEn.admin.cms.blog.editor;

function renderEditor() {
  return render(
    <BlogArticleEditor
      locale="en"
      pageTitle={dictEn.admin.cms.blog.list.create}
      labels={labels}
      academicLabels={dictEn.dashboard.adminContents}
      fileUploadProgress={dictEn.common.fileUpload}
      initial={{
        defaultLocale: "es",
        status: "draft",
        tags: [],
        scheduledFor: "",
        isPinned: false,
        hasGoogleKey: true,
        translationsByLocale: {},
      }}
    />,
  );
}

describe("BlogArticleEditor single locale", () => {
  it("does not render article language tabs or Google translate actions", () => {
    renderEditor();

    expect(screen.queryByRole("tablist", { name: labels.localeTabsAria })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: labels.localeTabs.en })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: labels.localeTabs.pt })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: labels.translateToLocale.replace("{locale}", labels.localeTabs.en) }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(labels.translateManualHint)).not.toBeInTheDocument();
  });
});

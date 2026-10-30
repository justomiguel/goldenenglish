import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlogArticleDetailDesktop } from "@/components/desktop/organisms/BlogArticleDetailDesktop";
import { BlogArticleDetailMobile } from "@/components/pwa/organisms/BlogArticleDetailMobile";
import type { RichContentDisplayLabels } from "@/lib/rich-content/richContentDisplayTypes";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/es/blog/marzo",
}));

vi.mock("@/app/[locale]/dashboard/admin/cms/blog/blogPublicActions", () => ({
  createGuestBlogCommentAction: vi.fn(),
}));

const labels = {
  guestName: "Name",
  guestEmail: "Email",
  placeholder: "Comment",
  guestSend: "Send comment",
  guestPending: "Your comment is waiting for review.",
  guestOpen: "Write a comment",
};

const base = {
  locale: "es",
  title: "Marzo",
  excerpt: "",
  bodyHtml: "<p>Hola</p>",
  coverImageUrl: null,
  coverUnoptimized: false,
  attachments: [],
  attachmentsTitle: "Files",
  heroLabels: {
    backToBlog: "Back",
    articleEyebrow: "Blog",
    publishedDateAria: "Date",
  },
  displayDate: "1 mar",
  displayDateIso: "2026-03-01",
  viewsLabel: "1",
  richContentLabels: {
    downloadFile: "Download",
    audioLabel: "Audio",
    videoLabel: "Video",
    attachmentTypes: {
      pdf: "PDF",
      word: "Word",
      spreadsheet: "Sheet",
      presentation: "Slides",
      office: "Office",
      image: "Image",
      audio: "Audio",
      video: "Video",
      other: "File",
    },
    pdfViewer: {
      viewPdf: "PDF",
      loading: "Loading",
      loadError: "Error",
      pageSummary: "Page",
      previousPage: "Previous",
      nextPage: "Next",
      openInNewTab: "Open",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
    },
  } satisfies RichContentDisplayLabels,
};

describe("blog article detail surfaces", () => {
  it("shows the call to action and the inline guest form on desktop", () => {
    render(
      <BlogArticleDetailDesktop
        {...base}
        publicExtras={{
          locale: "es",
          articleId: "11111111-1111-4111-8111-111111111111",
          ctaLabel: "Inscripción",
          ctaUrl: "/register",
          guestCommentsEnabled: true,
          fromIndex: false,
          guestLabels: labels,
        }}
      />,
    );
    expect(screen.getByRole("link", { name: "Inscripción" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Name" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Email" })).toBeTruthy();
  });

  it("keeps the guest email inside the sheet on mobile", async () => {
    const { user } = await import("@testing-library/user-event").then((mod) => ({
      user: mod.default.setup(),
    }));
    render(
      <BlogArticleDetailMobile
        {...base}
        publicExtras={{
          locale: "es",
          articleId: "11111111-1111-4111-8111-111111111111",
          ctaLabel: "Inscripción",
          ctaUrl: "/register",
          guestCommentsEnabled: true,
          fromIndex: false,
          guestLabels: labels,
        }}
      />,
    );
    expect(screen.queryByRole("textbox", { name: "Email" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Write a comment" }));
    expect(screen.getByRole("textbox", { name: "Email" })).toBeTruthy();
  });

  it("hides the guest name when guests are off", () => {
    render(
      <BlogArticleDetailDesktop
        {...base}
        publicExtras={{
          locale: "es",
          articleId: "11111111-1111-4111-8111-111111111111",
          ctaLabel: null,
          ctaUrl: null,
          guestCommentsEnabled: false,
          fromIndex: false,
          guestLabels: labels,
        }}
      />,
    );
    expect(screen.queryByRole("textbox", { name: "Name" })).toBeNull();
  });
});

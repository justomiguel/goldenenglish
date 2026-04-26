import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminGlobalContentReadOnly } from "@/components/admin/AdminGlobalContentReadOnly";
import { dictEn } from "@/test/dictEn";

describe("AdminGlobalContentReadOnly", () => {
  it("renders global content without editing controls in the body", () => {
    const labels = dictEn.dashboard.adminContents;

    render(
      <AdminGlobalContentReadOnly
        locale="en"
        labels={labels}
        content={{
          id: "00000000-0000-4000-8000-000000000001",
          title: "Pronunciation workshop",
          description: "Reusable lesson",
          bodyHtml: "<p>Read this before class.</p>",
          updatedAt: "2026-04-20T00:00:00Z",
          assetCount: 2,
          blockCount: 2,
          assets: [
            {
              id: "00000000-0000-4000-8000-000000000002",
              label: "Intro video",
              kind: "embed",
              mimeType: null,
              embedUrl: "https://www.youtube.com/embed/demo",
              storagePath: null,
            },
            {
              id: "00000000-0000-4000-8000-000000000004",
              label: "Listening drill",
              kind: "file",
              mimeType: "audio/mpeg",
              embedUrl: null,
              storagePath: "templates/audio/listening.mp3",
            },
          ],
          blocks: [
            {
              id: "00000000-0000-4000-8000-000000000003",
              kind: "video_embed",
              sortOrder: 1,
              assetId: "00000000-0000-4000-8000-000000000002",
              payload: { label: "Intro video", embedUrl: "https://www.youtube.com/embed/demo" },
            },
            {
              id: "00000000-0000-4000-8000-000000000005",
              kind: "audio",
              sortOrder: 2,
              assetId: "00000000-0000-4000-8000-000000000004",
              payload: { label: "Listening drill", mime: "audio/mpeg" },
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(labels.globalViewReadOnlyBadge)).toBeInTheDocument();
    expect(screen.getByText("Read this before class.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.mediaViewerOpen })).toBeInTheDocument();
    expect(screen.getByText(labels.audioPlaylistTitle)).toBeInTheDocument();
    expect(screen.getByText(labels.audioPlaylistNowPlaying.replace("{title}", "Listening drill"))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: labels.edit })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/academic/contents/global/00000000-0000-4000-8000-000000000001/edit",
    );
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlogHub } from "@/components/dashboard/admin/cms/blog/BlogHub";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  usePathname: () => "/es/dashboard/admin/cms/blog",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams("tab=config"),
}));

const blog = dictEn.admin.cms.blog;

describe("BlogHub", () => {
  it("opens the config tab from the URL", () => {
    render(
      <BlogHub
        locale="es"
        canConfigure
        rows={[]}
        canDelete={false}
        listLabels={blog.list}
        hubLabels={blog.hub}
        config={{
          blogEnabled: true,
          commentsEnabled: true,
          guestCommentsEnabled: false,
          labels: blog.config,
        }}
        stats={null}
      />,
    );
    expect(screen.getByRole("switch", { name: blog.config.guestComments })).toBeTruthy();
  });

  it("hides config and stats for a teacher", () => {
    render(
      <BlogHub
        locale="es"
        canConfigure={false}
        rows={[]}
        canDelete={false}
        listLabels={blog.list}
        hubLabels={blog.hub}
        config={null}
        stats={null}
      />,
    );
    expect(screen.queryByRole("tab", { name: blog.hub.config })).toBeNull();
    expect(screen.queryByRole("tab", { name: blog.hub.stats })).toBeNull();
  });
});

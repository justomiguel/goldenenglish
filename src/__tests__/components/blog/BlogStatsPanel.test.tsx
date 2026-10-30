import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlogStatsPanel } from "@/components/dashboard/admin/cms/blog/BlogStatsPanel";
import { dictEn } from "@/test/dictEn";

describe("BlogStatsPanel", () => {
  it("shows reading and an em dash when a rate is null", () => {
    render(
      <BlogStatsPanel
        locale="en"
        reading={12}
        listToArticle={null}
        ctaRate={null}
        commentRate={null}
        rows={[]}
        labels={dictEn.admin.cms.blog.stats}
      />,
    );
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getAllByText(dictEn.admin.cms.blog.stats.emDash).length).toBeGreaterThan(0);
  });
});

/**
 * REGRESSION CHECK: Blog, events, and classic register/contact shells expose
 * the language selector in the footer (not the header). Origin: UX 2026-05.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { mockPathname } from "@/test/navigationMock";

import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import { PublicBlogScreenClassic } from "@/components/organisms/PublicBlogScreenClassic";
import { RegisterSiteHeader } from "@/components/molecules/RegisterSiteHeader";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

const languageLabel = dictEn.common.locale.label;

describe("PublicContentLanguageFooter", () => {
  it("renders all locale links", () => {
    mockPathname.mockReturnValue("/es/blog/my-post");
    render(
      <PublicContentLanguageFooter
        locale="es"
        labels={dictEn.common.locale}
      />,
    );
    const nav = screen.getByRole("navigation", { name: languageLabel });
    const hrefs = Array.from(nav.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toEqual(
      expect.arrayContaining(["/es/blog/my-post", "/en/blog/my-post", "/pt/blog/my-post"]),
    );
  });
});

describe("Public blog/events shell — footer language selector", () => {
  it("PublicBlogScreenClassic footer has language nav; header does not", () => {
    mockPathname.mockReturnValue("/es/blog");
    render(
      <PublicBlogScreenClassic
        locale="es"
        dict={dictEn}
        brand={mockBrandPublic}
        sessionEmail={null}
        blogEnabled
        blogLabel="Blog"
        eventsLabel="Events"
      >
        <p>Article body</p>
      </PublicBlogScreenClassic>,
    );
    expect(screen.getByText("Article body")).toBeInTheDocument();
    const navs = screen.getAllByRole("navigation", { name: languageLabel });
    expect(navs).toHaveLength(1);
    expect(navs[0]?.closest("footer")).toBeTruthy();
  });

  it("RegisterSiteHeader does not render the language selector", () => {
    mockPathname.mockReturnValue("/es/blog");
    render(
      <RegisterSiteHeader brand={mockBrandPublic} locale="es" dict={dictEn} />,
    );
    expect(
      screen.queryByRole("navigation", { name: languageLabel }),
    ).toBeNull();
  });
});

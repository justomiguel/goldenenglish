import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockPathname, mockSearchParams } from "@/test/navigationMock";
import { ParentSidebarNavContent } from "@/components/dashboard/ParentSidebarNavContent";
import { dictEn } from "@/test/dictEn";

const BASE = "/en/dashboard/parent";

describe("ParentSidebarNavContent — studentId propagation", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue(`${BASE}/progress`);
  });

  it("appends studentId=s2 to every parent nav link href when present in search params", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("studentId=s2"));
    render(
      <ParentSidebarNavContent
        locale="en"
        dict={dictEn.dashboard.parentNav}
        baseHref={BASE}
      />,
    );
    const links = screen.getAllByRole("link");
    const parentLinks = links.filter((l) =>
      (l.getAttribute("href") ?? "").startsWith(BASE),
    );
    expect(parentLinks.length).toBeGreaterThan(0);
    for (const link of parentLinks) {
      expect(link.getAttribute("href")).toContain("studentId=s2");
    }
  });

  it("does not add any query string when search params carry no studentId", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams());
    render(
      <ParentSidebarNavContent
        locale="en"
        dict={dictEn.dashboard.parentNav}
        baseHref={BASE}
      />,
    );
    const links = screen.getAllByRole("link");
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href).not.toContain("studentId=");
    }
  });

  it("leaves student-portal hrefs untouched when there is no studentId in search params", () => {
    mockPathname.mockReturnValue("/en/dashboard/student/progress");
    mockSearchParams.mockReturnValue(new URLSearchParams());
    render(
      <ParentSidebarNavContent
        locale="en"
        dict={dictEn.dashboard.parentNav}
        baseHref="/en/dashboard/student"
      />,
    );
    const links = screen.getAllByRole("link");
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href).not.toMatch(/[?&]studentId=/);
      expect(href).not.toMatch(/\?$/);
    }
  });
});

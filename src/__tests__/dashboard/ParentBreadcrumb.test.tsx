import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockPathname, mockSearchParams } from "@/test/navigationMock";
import { ParentBreadcrumb } from "@/components/dashboard/ParentBreadcrumb";
import { dictEn } from "@/test/dictEn";

const BASE = "/en/dashboard/parent";

describe("ParentBreadcrumb — studentId propagation", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue(`${BASE}/progress`);
  });

  it("appends studentId=s2 to crumb hrefs when present in search params", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("studentId=s2"));
    render(
      <ParentBreadcrumb locale="en" dict={dictEn.dashboard.parentNav} baseHref={BASE} />,
    );
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).toContain("studentId=s2");
    }
  });

  it("does not add any query string to crumb hrefs when no studentId in search params", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams());
    render(
      <ParentBreadcrumb locale="en" dict={dictEn.dashboard.parentNav} baseHref={BASE} />,
    );
    const links = screen.getAllByRole("link");
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href).not.toContain("studentId=");
    }
  });
});

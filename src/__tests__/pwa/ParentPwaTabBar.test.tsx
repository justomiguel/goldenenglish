import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockPathname, mockSearchParams } from "@/test/navigationMock";
import { ParentPwaTabBar } from "@/components/pwa/molecules/ParentPwaTabBar";
import { dictEn } from "@/test/dictEn";

const BASE = "/en/dashboard/parent";

describe("ParentPwaTabBar — studentId propagation", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue(BASE);
  });

  it("appends studentId=s2 to every tab href when present in search params", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("studentId=s2"));
    render(
      <ParentPwaTabBar locale="en" dict={dictEn.dashboard.parentNav} baseHref={BASE} />,
    );
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).toContain("studentId=s2");
    }
  });

  it("does not add any query string when search params carry no studentId", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams());
    render(
      <ParentPwaTabBar locale="en" dict={dictEn.dashboard.parentNav} baseHref={BASE} />,
    );
    const links = screen.getAllByRole("link");
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href).not.toContain("studentId=");
    }
  });
});

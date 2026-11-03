/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StudentNextClassCard } from "@/components/student/StudentNextClassCard";
import { dictEn } from "@/test/dictEn";

// REGRESSION CHECK: The join control is absent when joinHref is null.
// When joinHref is set, the same full-width 44px link shows on every surface.

const joinLabel = "Join the class";

function hubDict() {
  return {
    ...dictEn.dashboard.student.hub,
    joinClass: joinLabel,
  };
}

describe("StudentNextClassCard join control", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("hides the join link when joinHref is null", () => {
    render(
      <StudentNextClassCard sections={[]} dict={hubDict()} joinHref={null} />,
    );

    expect(screen.queryByRole("link", { name: joinLabel })).not.toBeInTheDocument();
  });

  it("shows a full-width 44px join link when joinHref is set", () => {
    render(
      <div style={{ width: 390 }}>
        <StudentNextClassCard
          sections={[]}
          dict={hubDict()}
          joinHref="/es/dashboard/student/sections/sec-1/class?day=1&start=18:00"
        />
      </div>,
    );

    const link = screen.getByRole("link", { name: joinLabel });
    expect(link).toHaveAttribute(
      "href",
      "/es/dashboard/student/sections/sec-1/class?day=1&start=18:00",
    );
    expect(link.className).toContain("min-h-[44px]");
    expect(link.className).toContain("w-full");
  });
});

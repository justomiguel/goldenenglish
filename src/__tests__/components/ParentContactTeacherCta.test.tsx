import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ParentContactTeacherCta } from "@/components/parent/ParentContactTeacherCta";

const labels = {
  contactTeacherTitle: "Contact teacher",
  contactTeacherUnassigned: "Not assigned",
  contactTeacherCta: "Message {teacher}",
};

describe("ParentContactTeacherCta", () => {
  it("renders deep link with assigned teacher id when present", () => {
    render(
      <ParentContactTeacherCta
        locale="en"
        assignedTeacherId="t1"
        assignedTeacherName="Jane Doe"
        labels={labels}
      />,
    );
    const link = screen.getByRole("link", { name: /Message Jane Doe/ });
    expect(link.getAttribute("href")).toBe("/en/dashboard/parent/messages?to=t1");
  });

  it("falls back to unassigned message", () => {
    render(
      <ParentContactTeacherCta
        locale="en"
        assignedTeacherId={null}
        assignedTeacherName={null}
        labels={labels}
      />,
    );
    expect(screen.getByText("Not assigned")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

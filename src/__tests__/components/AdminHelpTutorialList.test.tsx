// REGRESSION CHECK: Each catalog row owns its own Play; multi-tour growth must not collapse to one CTA.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminHelpTutorialList } from "@/components/dashboard/AdminHelpTutorialList";

const dict = {
  startCta: "Start tutorial",
  startCtaAria: "Start tutorial: {{title}}",
  listAria: "Available tutorials",
  empty: "No tutorials",
  "create-cohort": {
    title: "How do I create a cohort?",
    description: "Walkthrough",
  },
  "create-section": {
    title: "How do I create a section?",
    description: "Section walkthrough",
  },
  "create-student": {
    title: "How do I create a student?",
    description: "Student walkthrough",
  },
  "create-teacher": {
    title: "How do I create a teacher?",
    description: "Teacher walkthrough",
  },
  "create-admin": {
    title: "How do I create an admin?",
    description: "Admin walkthrough",
  },
};

describe("AdminHelpTutorialList", () => {
  it("renders a dedicated Play button per catalog row", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<AdminHelpTutorialList dict={dict} onStart={onStart} />);

    const plays = screen.getAllByRole("button", { name: /Start tutorial:/i });
    expect(plays.length).toBeGreaterThanOrEqual(1);
    expect(plays).toHaveLength(
      screen.getAllByRole("listitem").length,
    );

    await user.click(
      screen.getByRole("button", { name: "Start tutorial: How do I create a cohort?" }),
    );
    expect(onStart).toHaveBeenCalledWith("create-cohort");
  });
});

// REGRESSION CHECK: Each catalog row owns its own Play; multi-tour growth must not collapse to one CTA.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminHelpTutorialList } from "@/components/dashboard/AdminHelpTutorialList";
import { listAdminTutorials } from "@/lib/admin-tutorials/catalog";

const catalogEntries = Object.fromEntries(
  listAdminTutorials().map((t) => [
    t.id,
    { title: `Title ${t.id}`, description: `Desc ${t.id}` },
  ]),
);

const dict = {
  startCta: "Start tutorial",
  startCtaAria: "Start tutorial: {{title}}",
  listAria: "Available tutorials",
  empty: "No tutorials",
  ...catalogEntries,
};

const groupsDict = {
  academic: "Academic",
  billing: "Billing",
  users: "Users",
  content: "Content",
};

describe("AdminHelpTutorialList", () => {
  it("renders a dedicated Play button per catalog row under group headings", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(
      <AdminHelpTutorialList dict={dict as never} groupsDict={groupsDict} onStart={onStart} />,
    );

    expect(screen.getByRole("heading", { name: "Academic" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Billing" })).toBeInTheDocument();

    const plays = screen.getAllByRole("button", { name: /Start tutorial:/i });
    expect(plays).toHaveLength(listAdminTutorials().length);

    await user.click(screen.getByRole("button", { name: "Start tutorial: Title create-cohort" }));
    expect(onStart).toHaveBeenCalledWith("create-cohort");
  });
});

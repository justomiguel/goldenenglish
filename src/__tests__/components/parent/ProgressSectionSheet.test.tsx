// REGRESSION CHECK: touch-first twin of ProgressSectionDropdown. It must stay dismissible by
// backdrop and Escape (there is no visible chrome to fall back on inside the installed app) and must
// never offer a section the caller did not pass.

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookOpenCheck, ScrollText } from "lucide-react";
import { ProgressSectionSheet } from "@/components/pwa/molecules/ProgressSectionSheet";
import type { ProgressPickerOption } from "@/components/parent/progressPickerOption";
import { dictEn } from "@/test/dictEn";

const copy = dictEn.dashboard.parent.progressPicker;

const OPTIONS: ProgressPickerOption[] = [
  {
    id: "tasks",
    label: "Tasks",
    Icon: BookOpenCheck,
    countLabel: "2 tasks",
    unreadCount: 0,
    unreadLabel: null,
    unreadAria: "",
  },
  {
    id: "feedback",
    label: "Feedback",
    Icon: ScrollText,
    countLabel: "3 comments",
    unreadCount: 3,
    unreadLabel: "3 unread",
    unreadAria: "3 unread in Feedback",
  },
];

function renderSheet(overrides: Partial<Parameters<typeof ProgressSectionSheet>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <ProgressSectionSheet
      options={OPTIONS}
      value="tasks"
      onChange={onChange}
      copy={copy}
      {...overrides}
    />,
  );
  return { onChange };
}

describe("ProgressSectionSheet", () => {
  it("shows the current section, its count and what is pending on the trigger", () => {
    renderSheet();

    const trigger = screen.getByRole("button", { name: /section/i });
    expect(trigger).toHaveTextContent("Tasks");
    expect(trigger).toHaveTextContent("2 tasks");
    expect(trigger).toHaveTextContent("3 unread");
  });

  it("keeps the sheet closed until it is tapped", () => {
    renderSheet();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a labelled sheet listing the available sections", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole("button", { name: /section/i }));

    const dialog = screen.getByRole("dialog", { name: copy.sheetTitle });
    expect(dialog).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("selects a section and closes", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSheet();

    await user.click(screen.getByRole("button", { name: /section/i }));
    await user.click(screen.getByRole("option", { name: /Feedback/ }));

    expect(onChange).toHaveBeenCalledWith("feedback");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("dismisses when the backdrop is tapped", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole("button", { name: /section/i }));
    await user.click(screen.getByTestId("progress-section-sheet-backdrop"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("dismisses with Escape", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole("button", { name: /section/i }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("dismisses with the close button", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole("button", { name: /section/i }));
    await user.click(screen.getByRole("button", { name: copy.close }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a plain label when only one section has content", () => {
    renderSheet({ options: [OPTIONS[1]!] });

    expect(screen.queryByRole("button", { name: /section/i })).not.toBeInTheDocument();
    expect(screen.getByText("Feedback")).toBeInTheDocument();
    expect(screen.getByText("3 comments")).toBeInTheDocument();
  });
});

// REGRESSION CHECK: the pointer-first Progress picker replaced a tablist, so it carries the
// accessibility contract on its own: a labelled combobox trigger, a listbox with one option per
// available section, arrow-key navigation, and Escape returning focus to the trigger.

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookOpenCheck, ScrollText } from "lucide-react";
import { ProgressSectionDropdown } from "@/components/desktop/molecules/ProgressSectionDropdown";
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

function renderDropdown(overrides: Partial<Parameters<typeof ProgressSectionDropdown>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <ProgressSectionDropdown
      options={OPTIONS}
      value="tasks"
      onChange={onChange}
      copy={copy}
      {...overrides}
    />,
  );
  return { onChange };
}

describe("ProgressSectionDropdown", () => {
  it("shows the current section and its count on the trigger", () => {
    renderDropdown();

    const trigger = screen.getByRole("combobox", { name: /section/i });
    expect(trigger).toHaveTextContent("Tasks");
    expect(trigger).toHaveTextContent("2 tasks");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("surfaces the total unread count on the closed trigger", () => {
    renderDropdown();

    expect(screen.getByText("3 unread")).toBeInTheDocument();
  });

  it("lists one option per available section when opened", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("combobox", { name: /section/i }));

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("Tasks");
    expect(options[1]).toHaveTextContent("Feedback");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("reports the unread count of each option to assistive tech", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("combobox", { name: /section/i }));

    expect(screen.getByLabelText("3 unread in Feedback")).toBeInTheDocument();
  });

  it("selects an option with a click and closes", async () => {
    const user = userEvent.setup();
    const { onChange } = renderDropdown();

    await user.click(screen.getByRole("combobox", { name: /section/i }));
    await user.click(screen.getByRole("option", { name: /Feedback/ }));

    expect(onChange).toHaveBeenCalledWith("feedback");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("moves through the options with the arrow keys and commits with Enter", async () => {
    const user = userEvent.setup();
    const { onChange } = renderDropdown();

    await user.click(screen.getByRole("combobox", { name: /section/i }));
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenCalledWith("feedback");
  });

  it("closes on Escape and gives focus back to the trigger", async () => {
    const user = userEvent.setup();
    renderDropdown();

    const trigger = screen.getByRole("combobox", { name: /section/i });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes when the pointer goes elsewhere", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ProgressSectionDropdown options={OPTIONS} value="tasks" onChange={vi.fn()} copy={copy} />
        <button type="button">outside</button>
      </div>,
    );

    await user.click(screen.getByRole("combobox", { name: /section/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders a plain label instead of a control when only one section has content", () => {
    renderDropdown({ options: [OPTIONS[0]!] });

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
    expect(screen.getByText("2 tasks")).toBeInTheDocument();
  });
});

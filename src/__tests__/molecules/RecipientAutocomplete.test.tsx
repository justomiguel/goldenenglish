// REGRESSION CHECK: Messaging compose depends on filtering, selection, and keyboard UX.
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipientAutocomplete } from "@/components/molecules/RecipientAutocomplete";
import type { MessagingRecipient } from "@/types/messaging";

const options: MessagingRecipient[] = [
  { id: "a1", first_name: "Ada", last_name: "Lovelace", role: "student" },
  { id: "b1", first_name: "Bob", last_name: "Builder", role: "teacher" },
];

const roleLabels = { student: "Students", teacher: "Teachers", admin: "Admins" };

function setup(onValueChange = vi.fn()) {
  render(
    <RecipientAutocomplete
      id="rec-test"
      options={options}
      value=""
      onValueChange={onValueChange}
      placeholder="Search"
      noMatchesText="None"
      emptyOptionsText="Directory empty"
      roleLabels={roleLabels}
      ariaLabel="To"
    />,
  );
  return onValueChange;
}

describe("RecipientAutocomplete", () => {
  it("lists recipients on focus and filters while typing", async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByRole("combobox", { name: "To" });
    await user.click(input);
    expect(screen.getByRole("option", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bob Builder" })).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, "bob");
    expect(screen.queryByRole("option", { name: "Ada Lovelace" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bob Builder" })).toBeInTheDocument();
  });

  it("selects recipient on option click", async () => {
    const user = userEvent.setup();
    const onValueChange = setup();
    await user.click(screen.getByRole("combobox", { name: "To" }));
    await user.click(screen.getByRole("option", { name: "Ada Lovelace" }));
    expect(onValueChange).toHaveBeenCalledWith("a1");
  });

  it("shows no matches text when query matches nothing", async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByRole("combobox", { name: "To" });
    await user.click(input);
    await user.type(input, "zzz");
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("selects highlighted option with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = setup();
    const input = screen.getByRole("combobox", { name: "To" });
    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("a1");
  });

  it("opens list with ArrowDown after list was closed", async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByRole("combobox", { name: "To" });
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("opens list with ArrowUp when panel was closed", async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByRole("combobox", { name: "To" });
    await user.click(input);
    await user.keyboard("{Escape}");
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("shows empty-directory hint when options empty", async () => {
    const user = userEvent.setup();
    render(
      <RecipientAutocomplete
        id="rec-empty"
        options={[]}
        value=""
        onValueChange={vi.fn()}
        placeholder="Search"
        noMatchesText="None"
        emptyOptionsText="Directory empty"
        roleLabels={roleLabels}
        ariaLabel="To"
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "To" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Directory empty");
  });

  it("closes list when input blurs with no focus target", async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByRole("combobox", { name: "To" });
    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.blur(input, { relatedTarget: null });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("ignores arrow keys when filtered list is empty", async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByRole("combobox", { name: "To" });
    await user.click(input);
    await user.keyboard("zzz");
    expect(screen.getByText("None")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("tolerates ArrowDown when options list is empty", async () => {
    const user = userEvent.setup();
    render(
      <RecipientAutocomplete
        id="rec-noopts"
        options={[]}
        value=""
        onValueChange={vi.fn()}
        placeholder="Search"
        noMatchesText="None"
        emptyOptionsText="Directory empty"
        roleLabels={roleLabels}
        ariaLabel="To"
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "To" }));
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("status")).toHaveTextContent("Directory empty");
  });

  it("reflects aria-selected on the matching option when value is preset", async () => {
    const user = userEvent.setup();
    render(
      <RecipientAutocomplete
        id="rec-pre"
        options={options}
        value="a1"
        onValueChange={vi.fn()}
        placeholder="Search"
        noMatchesText="None"
        emptyOptionsText="Directory empty"
        roleLabels={roleLabels}
        ariaLabel="To"
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "To" }));
    expect(screen.getByRole("option", { name: "Ada Lovelace" })).toHaveAttribute("aria-selected", "true");
  });

  it("ArrowUp from start wraps to last option", async () => {
    const user = userEvent.setup();
    const onValueChange = setup();
    const input = screen.getByRole("combobox", { name: "To" });
    await user.click(input);
    await user.keyboard("{ArrowUp}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("b1");
  });

  it("does not pick on Enter when several options and highlight not set", async () => {
    const user = userEvent.setup();
    const onValueChange = setup();
    await user.click(screen.getByRole("combobox", { name: "To" }));
    await user.keyboard("{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("picks the only option on Enter without moving highlight", async () => {
    const user = userEvent.setup();
    const solo: MessagingRecipient[] = [
      { id: "only", first_name: "Solo", last_name: "User", role: "student" },
    ];
    const onValueChange = vi.fn();
    render(
      <RecipientAutocomplete
        id="rec-solo"
        options={solo}
        value=""
        onValueChange={onValueChange}
        placeholder="Search"
        noMatchesText="None"
        emptyOptionsText="Directory empty"
        roleLabels={roleLabels}
        ariaLabel="To"
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "To" }));
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("only");
  });

  it("closes list on Escape", async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByRole("combobox", { name: "To" });
    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes list on outside mousedown", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("combobox", { name: "To" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not open list when disabled", async () => {
    const user = userEvent.setup();
    render(
      <RecipientAutocomplete
        id="rec-dis"
        options={options}
        value=""
        onValueChange={vi.fn()}
        disabled
        placeholder="Search"
        noMatchesText="None"
        emptyOptionsText="Directory empty"
        roleLabels={roleLabels}
        ariaLabel="To"
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "To" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

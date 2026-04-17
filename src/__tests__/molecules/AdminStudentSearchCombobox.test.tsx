/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminStudentSearchCombobox } from "@/components/molecules/AdminStudentSearchCombobox";

describe("AdminStudentSearchCombobox", () => {
  it("uses label + input and calls search after min length", async () => {
    const user = userEvent.setup();
    const search = vi.fn().mockResolvedValue([{ id: "1", label: "Ada Lovelace" }]);
    const onPick = vi.fn();

    render(
      <AdminStudentSearchCombobox
        id="test-student-search"
        labelText="Search"
        placeholder="Find…"
        minCharsHint="More chars"
        search={search}
        onPick={onPick}
      />,
    );

    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    const input = screen.getByPlaceholderText("Find…");
    await user.type(input, "Ad");
    await waitFor(() => expect(search).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("button", { name: "Ada Lovelace" })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Ada Lovelace" }));
    expect(onPick).toHaveBeenCalledWith({ id: "1", label: "Ada Lovelace" });
  });

  it("clears when resetKey changes", async () => {
    const search = vi.fn().mockResolvedValue([]);
    const { rerender } = render(
      <AdminStudentSearchCombobox
        id="r1"
        labelText="Search"
        placeholder="Find…"
        minCharsHint="More chars"
        search={search}
        onPick={() => {}}
        resetKey={0}
      />,
    );
    const input = screen.getByPlaceholderText("Find…") as HTMLInputElement;
    await userEvent.setup().type(input, "ab");
    expect(input.value).toBe("ab");
    rerender(
      <AdminStudentSearchCombobox
        id="r1"
        labelText="Search"
        placeholder="Find…"
        minCharsHint="More chars"
        search={search}
        onPick={() => {}}
        resetKey={1}
      />,
    );
    expect((screen.getByPlaceholderText("Find…") as HTMLInputElement).value).toBe("");
  });
});

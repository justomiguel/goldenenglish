/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminStudentSearchCombobox } from "@/components/molecules/AdminStudentSearchCombobox";

describe("AdminStudentSearchCombobox", () => {
  it("uses label + input and calls search from one character by default", async () => {
    const user = userEvent.setup();
    const search = vi.fn().mockResolvedValue([{ id: "1", label: "Ada Lovelace" }]);
    const onPick = vi.fn();

    render(
      <AdminStudentSearchCombobox
        id="test-student-search"
        labelText="Search"
        placeholder="Find…"
        minCharsHint="More chars"
        debounceMs={0}
        search={search}
        onPick={onPick}
      />,
    );

    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    const input = screen.getByPlaceholderText("Find…");
    await user.type(input, "A");
    await waitFor(() => expect(search).toHaveBeenCalledWith("A"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Ada Lovelace" })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Ada Lovelace" }));
    expect(onPick).toHaveBeenCalledWith({ id: "1", label: "Ada Lovelace" });
  });

  it("calls search with empty string when prefetchWhenEmptyOnFocus", async () => {
    const user = userEvent.setup();
    const search = vi.fn().mockResolvedValue([{ id: "1", label: "Zoe A" }]);

    render(
      <AdminStudentSearchCombobox
        id="prefetch-search"
        labelText="Search"
        placeholder="Find…"
        minCharsHint="More chars"
        debounceMs={0}
        prefetchWhenEmptyOnFocus
        search={search}
        onPick={() => {}}
      />,
    );

    await waitFor(() => expect(search).toHaveBeenCalledWith(""));
    await waitFor(() => expect(screen.getByRole("button", { name: "Zoe A" })).toBeInTheDocument());
    const input = screen.getByPlaceholderText("Find…");
    await user.clear(input);
    await user.type(input, "z");
    await waitFor(() => expect(search).toHaveBeenCalledWith("z"));
  });

  it("hides excluded ids from result list", async () => {
    const user = userEvent.setup();
    const search = vi
      .fn()
      .mockResolvedValue([
        { id: "1", label: "Ada" },
        { id: "2", label: "Bob" },
      ]);

    render(
      <AdminStudentSearchCombobox
        id="excl-search"
        labelText="Search"
        placeholder="Find…"
        minCharsHint="More chars"
        debounceMs={0}
        search={search}
        onPick={() => {}}
        excludeIds={["1"]}
        resultsListHeading="Candidates"
      />,
    );
    await user.type(screen.getByPlaceholderText("Find…"), "x");
    await waitFor(() => expect(screen.getByText("Candidates")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Bob" })).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Ada" })).not.toBeInTheDocument();
  });

  it("clears when resetKey changes", async () => {
    const user = userEvent.setup();
    const search = vi.fn().mockResolvedValue([]);
    const { rerender } = render(
      <AdminStudentSearchCombobox
        id="r1"
        labelText="Search"
        placeholder="Find…"
        minCharsHint="More chars"
        debounceMs={0}
        search={search}
        onPick={() => {}}
        resetKey={0}
      />,
    );
    const input = screen.getByPlaceholderText("Find…") as HTMLInputElement;
    await user.type(input, "ab");
    expect(input.value).toBe("ab");
    rerender(
      <AdminStudentSearchCombobox
        id="r1"
        labelText="Search"
        placeholder="Find…"
        minCharsHint="More chars"
        debounceMs={0}
        search={search}
        onPick={() => {}}
        resetKey={1}
      />,
    );
    await waitFor(() =>
      expect((screen.getByPlaceholderText("Find…") as HTMLInputElement).value).toBe(""),
    );
  });
});

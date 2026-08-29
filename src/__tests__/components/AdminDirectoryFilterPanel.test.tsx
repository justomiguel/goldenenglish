import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { AdminDirectoryFilterPanel } from "@/components/dashboard/AdminDirectoryFilterPanel";
import { emptyAdminDirectoryFacets } from "@/lib/dashboard/countAdminDirectoryFacets";

const labels = dictEn.admin.directoryFilters;

describe("AdminDirectoryFilterPanel", () => {
  it("starts closed without filter values and shows no clear button", () => {
    render(
      <AdminDirectoryFilterPanel
        role="student"
        labels={labels}
        values={{}}
        facets={emptyAdminDirectoryFacets()}
        sectionOptions={[]}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: labels.toggle })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("button", { name: labels.clear })).not.toBeInTheDocument();
  });

  it("starts open with a dot when a filter is active and clear keeps the callback", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <AdminDirectoryFilterPanel
        role="student"
        labels={labels}
        values={{ access: "never" }}
        facets={{
          ...emptyAdminDirectoryFacets(),
          access: { all: 4, never: 2, entered: 2 },
        }}
        sectionOptions={[]}
        onChange={vi.fn()}
        onClear={onClear}
      />,
    );
    const toggle = screen.getByRole("button", { name: labels.toggle });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle.querySelector("[data-active-dot]")).toBeTruthy();
    expect(
      screen.getByRole("option", {
        name: labels.optionWithCount.replace("{{label}}", labels.accessNever).replace("{{count}}", "2"),
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.clear }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

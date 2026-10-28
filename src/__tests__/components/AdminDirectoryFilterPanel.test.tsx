import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { mockSearchParams } from "@/test/navigationMock";
import { AdminDirectoryFilterPanel } from "@/components/dashboard/AdminDirectoryFilterPanel";
import { emptyAdminDirectoryFacets } from "@/lib/dashboard/countAdminDirectoryFacets";

const FIELD_ID = "11111111-1111-4111-8111-111111111111";

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

  it("exposes monthly status on student and parent, not teacher", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
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
    await user.click(screen.getByRole("button", { name: labels.toggle }));
    expect(screen.getByLabelText(labels.monthlyStatus)).toBeInTheDocument();

    rerender(
      <AdminDirectoryFilterPanel
        role="parent"
        labels={labels}
        values={{}}
        facets={emptyAdminDirectoryFacets()}
        sectionOptions={[]}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(labels.monthlyStatus)).toBeInTheDocument();

    rerender(
      <AdminDirectoryFilterPanel
        role="teacher"
        labels={labels}
        values={{}}
        facets={emptyAdminDirectoryFacets()}
        sectionOptions={[]}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText(labels.monthlyStatus)).not.toBeInTheDocument();
  });

  it("shows a custom academic field inside the filter panel", async () => {
    const user = userEvent.setup();
    render(
      <AdminDirectoryFilterPanel
        role="student"
        labels={labels}
        values={{}}
        facets={emptyAdminDirectoryFacets()}
        sectionOptions={[]}
        academicFields={{
          columns: [{ id: FIELD_ID, label: "Level", fieldType: "select", selectOptions: ["B1"] }],
          selectFacets: { [FIELD_ID]: { B1: 2 } },
          labels: dictEn.admin.users.academicFields,
        }}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: labels.toggle }));
    const panel = screen.getByRole("region", { name: labels.panelAria });
    expect(within(panel).getByRole("combobox", { name: "Level" })).toBeInTheDocument();
    expect(within(panel).getByRole("option", { name: "B1 (2)" })).toBeInTheDocument();
  });

  it("treats an active custom field filter like the other filters", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams(`acf_${FIELD_ID}=B1`));
    render(
      <AdminDirectoryFilterPanel
        role="student"
        labels={labels}
        values={{}}
        facets={emptyAdminDirectoryFacets()}
        sectionOptions={[]}
        academicFields={{
          columns: [{ id: FIELD_ID, label: "Level", fieldType: "select", selectOptions: ["B1"] }],
          selectFacets: { [FIELD_ID]: { B1: 1 } },
          labels: dictEn.admin.users.academicFields,
        }}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const toggle = screen.getByRole("button", { name: labels.toggle });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle.querySelector("[data-active-dot]")).toBeTruthy();
    expect(screen.getByRole("button", { name: labels.clear })).toBeInTheDocument();
  });
});

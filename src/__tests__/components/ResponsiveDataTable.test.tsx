// REGRESSION CHECK: Phone cards must keep every column value and every action.
// Desktop still renders a real table. Changing mobileRole drops fields from the card.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResponsiveDataTable } from "@/components/molecules/ResponsiveDataTable";

const useAppSurface = vi.fn(() => "web-desktop");

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => useAppSurface(),
}));

type Row = { id: string; name: string; status: string };

const columns = [
  { id: "name", header: "Name", cell: (row: Row) => row.name, mobileRole: "title" as const },
  { id: "status", header: "Status", cell: (row: Row) => row.status, mobileRole: "field" as const },
  {
    id: "actions",
    header: "Actions",
    cell: (row: Row) => <button type="button">Edit {row.name}</button>,
    mobileRole: "actions" as const,
  },
];

describe("ResponsiveDataTable", () => {
  it("renders a table with every column on desktop", () => {
    useAppSurface.mockReturnValue("web-desktop");
    render(
      <ResponsiveDataTable rows={[{ id: "1", name: "Ada", status: "Active" }]} columns={columns} rowKey={(row) => row.id} />,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Ada" })).toBeInTheDocument();
  });

  it("renders labeled cards with every field and action on a phone", () => {
    useAppSurface.mockReturnValue("web-mobile");
    render(
      <ResponsiveDataTable rows={[{ id: "1", name: "Ada", status: "Active" }]} columns={columns} rowKey={(row) => row.id} />,
    );
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Ada" })).toBeInTheDocument();
  });
});

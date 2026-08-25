import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UniversalListView } from "@/components/organisms/UniversalListView";

const sortLabels = { sortHintAsc: "asc", sortHintDesc: "desc", sortedAsc: "sorted asc", sortedDesc: "sorted desc" };

describe("UniversalListView", () => {
  it("wraps the table in the admin body card", () => {
    const { container } = render(
      <UniversalListView
        columns={[{ id: "name", label: "Name" }]}
        sortKey="name"
        sortDir="asc"
        onToggleSort={() => {}}
        sortLabels={sortLabels}
        emptyMessage="none"
        isEmpty={false}
      >
        <tr>
          <td>Ada</td>
        </tr>
      </UniversalListView>,
    );
    const shell = container.querySelector("table")?.parentElement;
    expect(shell?.className).toContain("rounded-2xl");
    expect(shell?.className).toContain("--color-background");
    expect(shell?.className).toContain("--shadow-soft");
    expect(shell?.className).not.toContain("--layout-border-radius");
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });
});

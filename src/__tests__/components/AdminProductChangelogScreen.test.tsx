import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminProductChangelogScreen } from "@/components/organisms/AdminProductChangelogScreen";
import en from "@/dictionaries/en.json";
import { listProductChangelogEntries, resolveProductChangelogCopy } from "@/lib/product-changelog/catalog";

describe("AdminProductChangelogScreen", () => {
  it("renders page chrome and the newest changelog entry", () => {
    render(
      <AdminProductChangelogScreen
        locale="en"
        pageDict={en.dashboard.adminChangelogPage}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: en.dashboard.adminChangelogPage.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.dashboard.adminChangelogPage.lead)).toBeInTheDocument();

    const newest = listProductChangelogEntries()[0];
    const copy = resolveProductChangelogCopy(newest, "en");
    expect(screen.getByRole("heading", { name: copy.title })).toBeInTheDocument();
    expect(screen.getByText(copy.summary)).toBeInTheDocument();
  });
});

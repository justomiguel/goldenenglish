import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminProductChangelogScreen } from "@/components/organisms/AdminProductChangelogScreen";
import { resolveProductChangelogCopy } from "@/lib/product-changelog/catalog";
import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import en from "@/dictionaries/en.json";

const entry: ProductChangelogEntry = {
  id: "section-share-photo",
  date: "2026-08-29",
  area: "academic",
  title: { es: "Foto de la sección", en: "Section photo", pt: "Foto da turma" },
  summary: {
    es: "Cada sección puede tener una foto para el link de inscripción.",
    en: "Each section can have a photo on its enrollment link.",
    pt: "Cada turma pode ter uma foto no link de inscrição.",
  },
};

describe("AdminProductChangelogScreen", () => {
  it("renders page chrome and the changelog entry", () => {
    render(
      <AdminProductChangelogScreen
        locale="en"
        pageDict={en.dashboard.adminChangelogPage}
        entries={[entry]}
        unavailableMessage={null}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: en.dashboard.adminChangelogPage.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.dashboard.adminChangelogPage.lead)).toBeInTheDocument();

    const copy = resolveProductChangelogCopy(entry, "en");
    expect(screen.getByRole("heading", { name: copy.title })).toBeInTheDocument();
    expect(screen.getByText(copy.summary)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the unavailable code when the notes did not load", () => {
    render(
      <AdminProductChangelogScreen
        locale="en"
        pageDict={en.dashboard.adminChangelogPage}
        entries={[]}
        unavailableMessage={en.dashboard.adminChangelogPage.unavailable}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("changelog_unavailable");
  });
});

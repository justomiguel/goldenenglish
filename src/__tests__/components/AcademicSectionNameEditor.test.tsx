/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionNameEditor } from "@/components/organisms/AcademicSectionNameEditor";

const { updateName, refresh } = vi.hoisted(() => ({
  updateName: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionNameActions", () => ({
  updateAcademicSectionNameAction: (...args: unknown[]) => updateName(...args),
}));

const dict = {
  title: "Section name",
  lead: "Lead",
  label: "Name",
  placeholder: "e.g. Morning A",
  save: "Save name",
  cancel: "Cancel",
  editNameAria: "Edit section name",
  success: "Section name updated.",
  error: "Could not save. Try again.",
  duplicate: "Another section in this cohort already uses that name.",
  tooShort: "Use at least 2 characters.",
};

const sectionId = "00000000-0000-4000-8000-000000000001";

describe("AcademicSectionNameEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("embedded: saves dirty name and refreshes", async () => {
    updateName.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <AcademicSectionNameEditor
        locale="es"
        sectionId={sectionId}
        initialName="Alpha"
        dict={dict}
        variant="embedded"
      />,
    );

    const input = screen.getByLabelText(dict.label);
    await user.clear(input);
    await user.type(input, "Beta");
    await user.click(screen.getByRole("button", { name: dict.save }));

    await waitFor(() => {
      expect(updateName).toHaveBeenCalledWith({
        locale: "es",
        sectionId,
        name: "Beta",
      });
    });
    expect(await screen.findByText(dict.success)).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("embedded: shows duplicate message and keeps value", async () => {
    updateName.mockResolvedValue({ ok: false, code: "DUPLICATE" });
    const user = userEvent.setup();
    render(
      <AcademicSectionNameEditor
        locale="es"
        sectionId={sectionId}
        initialName="Alpha"
        dict={dict}
        variant="embedded"
      />,
    );

    const input = screen.getByLabelText(dict.label);
    await user.clear(input);
    await user.type(input, "Taken");
    await user.click(screen.getByRole("button", { name: dict.save }));

    expect(await screen.findByText(dict.duplicate)).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    expect(input).toHaveValue("Taken");
  });

  it("inline: opens edit mode, saves, then exits editing", async () => {
    updateName.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <AcademicSectionNameEditor
        locale="es"
        sectionId={sectionId}
        initialName="Alpha"
        dict={dict}
        variant="inline"
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Alpha" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: dict.editNameAria }));
    const input = screen.getByLabelText(dict.label);
    await user.clear(input);
    await user.type(input, "Gamma");
    await user.click(screen.getByRole("button", { name: dict.save }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.queryByLabelText(dict.label)).not.toBeInTheDocument();
  });

  it("inline: stays in edit mode on duplicate", async () => {
    updateName.mockResolvedValue({ ok: false, code: "DUPLICATE" });
    const user = userEvent.setup();
    render(
      <AcademicSectionNameEditor
        locale="es"
        sectionId={sectionId}
        initialName="Alpha"
        dict={dict}
        variant="inline"
      />,
    );

    await user.click(screen.getByRole("button", { name: dict.editNameAria }));
    const input = screen.getByLabelText(dict.label);
    await user.clear(input);
    await user.type(input, "Taken");
    await user.click(screen.getByRole("button", { name: dict.save }));

    expect(await screen.findByText(dict.duplicate)).toBeInTheDocument();
    expect(screen.getByLabelText(dict.label)).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});

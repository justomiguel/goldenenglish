/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminAcademicProfileFields } from "@/components/molecules/AdminAcademicProfileFields";
import { dictEn } from "@/test/dictEn";
import type { AcademicProfileCardField } from "@/lib/academic-profile/academicProfileCard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/users/student",
}));
vi.mock("@/app/[locale]/dashboard/admin/users/academicProfileFieldActions", () => ({
  saveAcademicProfileFieldAction: vi.fn(),
  archiveAcademicProfileFieldAction: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/users/academicProfileValueActions", () => ({
  saveAcademicProfileValueAction: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/users/academicProfileFileActions", () => ({
  prepareAcademicProfileFileUploadAction: vi.fn(),
}));

const labels = dictEn.admin.users.academicFields;

const level: AcademicProfileCardField = {
  id: "11111111-1111-4111-8111-111111111111",
  label: "Level",
  fieldType: "text",
  selectOptions: [],
  required: true,
  showInDirectory: false,
  valueText: null,
  valueNumber: null,
  valueDate: null,
  storagePath: null,
  fileUrl: null,
};

describe("AdminAcademicProfileFields", () => {
  it("shows an em dash when the value is empty", () => {
    render(
      <AdminAcademicProfileFields
        locale="en"
        studentId="22222222-2222-4222-8222-222222222222"
        editable
        fields={[level]}
        labels={labels}
      />,
    );
    expect(screen.getByText(labels.empty)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.addField })).not.toBeInTheDocument();
  });

  it("shows add field only after edit", async () => {
    const user = userEvent.setup();
    render(
      <AdminAcademicProfileFields
        locale="en"
        studentId="22222222-2222-4222-8222-222222222222"
        editable
        fields={[level]}
        labels={labels}
      />,
    );
    await user.click(screen.getByRole("button", { name: labels.edit }));
    expect(screen.getByRole("button", { name: labels.addField })).toBeInTheDocument();
  });

  it("keeps edit mode when a required value is empty", async () => {
    const user = userEvent.setup();
    render(
      <AdminAcademicProfileFields
        locale="en"
        studentId="22222222-2222-4222-8222-222222222222"
        editable
        fields={[level]}
        labels={labels}
      />,
    );
    await user.click(screen.getByRole("button", { name: labels.edit }));
    await user.click(screen.getByRole("button", { name: labels.done }));
    expect(screen.getByText(labels.requiredError)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.done })).toBeInTheDocument();
  });
});

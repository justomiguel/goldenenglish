import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminEventCreateForm } from "@/components/dashboard/admin/events/AdminEventCreateForm";
import en from "@/dictionaries/en.json";

const labels = {
  titleLabel: "Title",
  descriptionLabel: "Description",
  eventDateLabel: "Date and time",
  locationLabel: "Location",
  capacityLabel: "Capacity",
  priceLocalLabel: "Local price",
  priceNonLocalLabel: "Non-local price",
  priceHint: "Leave empty for free.",
  currencyLabel: "Currency",
  submit: "Create event",
  back: "Back to events",
  errorSave: "Save failed",
  validationError: "Validation failed",
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/es/dashboard/admin/events/new",
}));

vi.mock("@/app/[locale]/dashboard/admin/events/actions", () => ({
  createEventAction: vi.fn(),
}));

describe("AdminEventCreateForm", () => {
  it("renders create fields and back link", () => {
    render(
      <AdminEventCreateForm
        locale="es"
        labels={labels}
        editorLabels={en.admin.cms.blog.editor}
        academicLabels={en.dashboard.adminContents}
      />,
    );

    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Date and time")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create event" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to events" })).toHaveAttribute(
      "href",
      "/es/dashboard/admin/events",
    );
  });
});

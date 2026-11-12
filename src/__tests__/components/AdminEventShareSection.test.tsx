/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminEventShareSection } from "@/components/dashboard/admin/events/AdminEventShareSection";
import en from "@/dictionaries/en.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/eventShareActions", () => ({
  requestEventShareAction: vi.fn(),
  requestEventUnshareAction: vi.fn(),
}));

const labels = en.admin.events.detail.share;

describe("AdminEventShareSection", () => {
  it("keeps the site list behind the share button", async () => {
    const user = userEvent.setup();
    render(
      <AdminEventShareSection
        locale="es"
        eventId="11111111-1111-4111-8111-111111111111"
        access="local"
        ownerName="Liora"
        grants={[]}
        sites={[{ slug: "matiss", displayName: "Matiss" }]}
        labels={labels}
      />,
    );

    expect(screen.queryByRole("checkbox", { name: "Matiss" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.title }));
    expect(screen.getByRole("checkbox", { name: "Matiss" })).toBeInTheDocument();
  });
});

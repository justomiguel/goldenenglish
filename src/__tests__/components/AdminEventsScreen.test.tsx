import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminEventsScreen } from "@/components/organisms/AdminEventsScreen";
import type { AdminEventRow } from "@/lib/dashboard/events/loadPaginatedAdminEvents";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  usePathname: () => "/es/dashboard/admin/events",
  useSearchParams: () => new URLSearchParams("page=2"),
}));

const labels = {
  countSuffix: "events",
  create: "Create event",
  title: "Title",
  date: "Date",
  status: "Status",
  capacity: "Capacity",
  views: "Views",
  price: "Price",
  creator: "Creator",
  actions: "Actions",
  manage: "Manage",
  empty: "No events found.",
  free: "Free",
  paginationPrev: "Previous",
  paginationNext: "Next",
  paginationSummary: "Page",
  paginationTipPrev: "Previous page",
  paginationTipNext: "Next page",
};

const row: AdminEventRow = {
  id: "event-1",
  slug: "open-day",
  title: "Open day",
  status: "published",
  eventDate: "2026-11-01T15:00:00.000Z",
  capacity: 20,
  attendeesCount: 1,
  viewCount: 3,
  price: 10000,
  currency: "CLP",
  priceByFlow: false,
  flowPrices: [],
  createdByName: "Pérez Ana",
};

describe("AdminEventsScreen", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("shows who created the event", () => {
    render(
      <AdminEventsScreen
        locale="es"
        rows={[row]}
        totalCount={1}
        page={1}
        pageSize={25}
        sort="event_date"
        dir="asc"
        labels={labels}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Creator" })).toBeInTheDocument();
    expect(screen.getAllByText("Pérez Ana")).toHaveLength(2);
    const card = screen.getByRole("heading", { name: "Open day" }).closest("article");
    expect(card).toHaveTextContent("Pérez Ana");
    expect(card).not.toHaveTextContent("sin orden");
    const manageLinks = screen.getAllByRole("link", { name: labels.manage });
    expect(manageLinks[0]).toHaveClass("min-h-11", "w-full", "bg-[var(--color-primary)]");
    expect(manageLinks[1]).toHaveClass("bg-[var(--color-primary)]");
  });

  it("sorts from the mobile control and resets the page", async () => {
    const user = userEvent.setup();
    render(
      <AdminEventsScreen
        locale="es"
        rows={[row]}
        totalCount={1}
        page={2}
        pageSize={25}
        sort="event_date"
        dir="asc"
        labels={labels}
      />,
    );

    await user.selectOptions(screen.getByRole("combobox", { name: labels.title }), "title:desc");
    expect(push).toHaveBeenCalledWith("/es/dashboard/admin/events?page=1&sort=title&dir=desc");
  });
});

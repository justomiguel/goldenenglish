/** @vitest-environment jsdom */
// REGRESSION CHECK: One featured event has no carousel controls. Two events
// expose previous/next and a position. A dismissed set stays closed.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeEventPopup } from "@/components/organisms/HomeEventPopup";
import type { HomeEventPopupEvent } from "@/lib/dashboard/events/loadHomeEventPopup";
import { HOME_EVENT_POPUP_STORAGE_KEY, homeEventPopupSetKey } from "@/lib/events/homeEventPopupDismissal";

vi.mock("next/navigation", () => ({
  usePathname: () => "/es",
}));

vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: vi.fn(),
}));

const labels = {
  dialogTitle: "Upcoming events",
  close: "Close",
  previous: "Previous event",
  next: "Next event",
  position: "{{current}} of {{total}}",
  dateLabel: "Date",
  locationLabel: "Location",
  viewEvent: "View event",
  imageLoading: "Loading image",
  free: "Free",
  priceLocal: "Local",
  priceNonLocal: "Non-local",
};

function event(id: string, title: string): HomeEventPopupEvent {
  return {
    id,
    slug: id,
    title,
    excerpt: "",
    coverImageUrl: null,
    eventDate: "2026-11-01T18:00:00.000Z",
    location: null,
    currency: "CLP",
    price: 0,
    priceLocal: 0,
    priceNonLocal: 0,
  };
}

describe("HomeEventPopup", () => {
  beforeEach(() => {
    sessionStorage.clear();
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.show = function show() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  });

  it("names the close button and hides carousel controls for a single event", async () => {
    render(<HomeEventPopup locale="en" events={[event("a", "Recital")]} labels={labels} />);
    expect(await screen.findByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recital" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous event" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next event" })).not.toBeInTheDocument();
  });

  it("steps through events and shows the position", async () => {
    const user = userEvent.setup();
    render(
      <HomeEventPopup
        locale="en"
        events={[event("a", "Recital"), event("b", "Workshop")]}
        labels={labels}
      />,
    );
    expect(await screen.findByText("1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("region")).toHaveAttribute("aria-roledescription", "carousel");
    await user.click(screen.getByRole("button", { name: "Next event" }));
    expect(screen.getByRole("heading", { name: "Workshop" })).toBeInTheDocument();
    expect(screen.getByText("2 of 2")).toBeInTheDocument();
  });

  it("stays closed after that set was dismissed", async () => {
    sessionStorage.setItem(HOME_EVENT_POPUP_STORAGE_KEY, homeEventPopupSetKey(["a"]));
    render(<HomeEventPopup locale="en" events={[event("a", "Recital")]} labels={labels} />);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

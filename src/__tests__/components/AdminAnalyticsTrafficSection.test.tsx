import { describe, expect, it, beforeAll } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminAnalyticsTrafficSection } from "@/components/dashboard/AdminAnalyticsTrafficSection";
import en from "@/dictionaries/en.json";

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
      ResizeObserverStub;
  }
});

const labels = en.admin.analytics;

const summary = {
  authenticated_hits: 12,
  guest_hits: 34,
  bot_hits: 56,
  total_hits: 102,
};

const daily = [
  { day: "2026-04-15", authenticated_hits: 4, guest_hits: 11, bot_hits: 18 },
  { day: "2026-04-16", authenticated_hits: 8, guest_hits: 23, bot_hits: 38 },
];

const breakdowns = {
  authenticated: {
    paths: [{ pathname: "/es/dashboard/student", cnt: 9 }],
    agents: [{ user_agent: "Mozilla/5.0 (Mac)", cnt: 9 }],
  },
  guest: {
    paths: [
      { pathname: "/es/register", cnt: 22 },
      { pathname: "/es/dashboard/admin", cnt: 4 },
    ],
    agents: [{ user_agent: "Mozilla/5.0 (Win)", cnt: 22 }],
  },
  bot: {
    paths: [{ pathname: "/es", cnt: 40 }],
    agents: [
      {
        user_agent:
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        cnt: 40,
      },
    ],
  },
};

describe("AdminAnalyticsTrafficSection", () => {
  it("hides the breakdown panel until the user clicks one of the kind cards", () => {
    render(
      <AdminAnalyticsTrafficSection
        locale="es"
        labels={labels}
        summary={summary}
        daily={daily}
        breakdowns={breakdowns}
      />,
    );
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("opens the panel on the Bots tab when the user clicks the bot card", async () => {
    const user = userEvent.setup();
    render(
      <AdminAnalyticsTrafficSection
        locale="es"
        labels={labels}
        summary={summary}
        daily={daily}
        breakdowns={breakdowns}
      />,
    );
    await user.click(screen.getByRole("button", { name: labels.trafficCardAriaBot }));
    const tablist = await screen.findByRole("tablist");
    const tabs = within(tablist).getAllByRole("tab");
    const botTab = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    expect(botTab).toHaveTextContent(labels.trafficBot);
    expect(screen.getByText("Googlebot")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: new RegExp(labels.trafficUaVendorLinkAria) }),
    ).toHaveAttribute("href", expect.stringContaining("google.com"));
    expect(screen.getByText("/es")).toBeInTheDocument();
  });

  it("warns when the guest tab shows pathnames that normally require auth", async () => {
    const user = userEvent.setup();
    render(
      <AdminAnalyticsTrafficSection
        locale="es"
        labels={labels}
        summary={summary}
        daily={daily}
        breakdowns={breakdowns}
      />,
    );
    await user.click(screen.getByRole("button", { name: labels.trafficCardAriaGuest }));
    expect(screen.getByText(labels.trafficBreakdownGuestProtectedNotice)).toBeInTheDocument();
    expect(
      screen.getAllByLabelText(labels.trafficBreakdownGuestProtectedRowAria).length,
    ).toBeGreaterThan(0);
  });

  it("collapses the panel when clicking the same card twice", async () => {
    const user = userEvent.setup();
    render(
      <AdminAnalyticsTrafficSection
        locale="es"
        labels={labels}
        summary={summary}
        daily={daily}
        breakdowns={breakdowns}
      />,
    );
    const guestCard = screen.getByRole("button", { name: labels.trafficCardAriaGuest });
    await user.click(guestCard);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    await user.click(guestCard);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("switches to a different kind when clicking another card while panel is open", async () => {
    const user = userEvent.setup();
    render(
      <AdminAnalyticsTrafficSection
        locale="es"
        labels={labels}
        summary={summary}
        daily={daily}
        breakdowns={breakdowns}
      />,
    );
    await user.click(screen.getByRole("button", { name: labels.trafficCardAriaAuth }));
    expect(screen.getByText("/es/dashboard/student")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.trafficCardAriaGuest }));
    expect(screen.getByText("/es/register")).toBeInTheDocument();
  });
});

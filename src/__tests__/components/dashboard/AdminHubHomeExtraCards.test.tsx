import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import {
  AdminHubHomeCollectionsCard,
  AdminHubHomeEventsCard,
  AdminHubHomePeoplePulseCard,
} from "@/components/dashboard/AdminHubHomeExtraCards";
import { dictEn } from "@/test/dictEn";

const base = "/en/dashboard/admin";

describe("AdminHubHomeExtraCards", () => {
  it("keeps pulse, collections, and events on a short row", () => {
    const widgets = dictEn.admin.home.layout.widgets;
    const { container } = render(
      <>
        <AdminHubHomePeoplePulseCard
          base={base}
          dict={dictEn}
          pulse={{ newLast30Days: 4, neverEntered: 2 }}
        />
        <AdminHubHomeCollectionsCard
          locale="en"
          base={base}
          dict={dictEn}
          collections={{ cohortName: "Fall", paid: 10, pendingReview: 3, overdue: 1 }}
        />
        <AdminHubHomeEventsCard
          locale="en"
          base={base}
          dict={dictEn}
          events={[
            { id: "e1", slug: "open-day", title: "Open day", eventDate: "2026-11-02", capacity: 20 },
            { id: "e2", slug: "recital", title: "Recital", eventDate: "2026-11-09", capacity: null },
          ]}
        />
      </>,
    );

    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(3);
    const expected: Array<[string, string]> = [
      [`${base}/students`, widgets.peoplePulseOpen],
      [`${base}/finance/collections`, widgets.collectionsOpen],
      [`${base}/events`, widgets.eventsOpen],
    ];
    links.forEach((card, index) => {
      expect(card.className).toContain("items-center");
      expect(card.className).toContain("p-3");
      expect(card.className).not.toContain("p-6");
      expect(card.getAttribute("href")).toBe(expected[index]?.[0]);
      const row = within(card);
      expect(row.getByText(expected[index]?.[1] ?? "").closest("a")).toBe(card);
      expect(card.querySelector("p")?.className).toContain("truncate");
    });

    expect(within(links[0] as HTMLElement).getByRole("heading", { name: widgets.peoplePulseTitle })).toBeTruthy();
    expect(links[0]?.textContent).toContain("4");
    expect(links[0]?.textContent).toContain("2");
    expect(links[1]?.textContent).toContain("Fall");
    expect(links[2]?.textContent).toContain("Open day");
    expect(links[2]?.textContent).not.toContain("Recital");
    expect(links[2]?.textContent).toContain(widgets.eventsMore.replace("{{count}}", "1"));
    expect(container.querySelector('a[href$="/events/e1"]')).toBeNull();
  });
});

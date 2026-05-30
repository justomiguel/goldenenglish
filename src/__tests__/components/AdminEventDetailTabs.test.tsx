import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import {
  AdminEventDetailTabs,
  EVENT_ADMIN_TAB_ORDER,
  parseEventAdminTab,
} from "@/components/dashboard/admin/events/AdminEventDetailTabs";

const detail = dictEn.admin.events.detail;
const baseHref = "/en/dashboard/admin/events/event-1";

describe("parseEventAdminTab", () => {
  it("defaults to summary when missing or unknown", () => {
    expect(parseEventAdminTab(undefined)).toBe("summary");
    expect(parseEventAdminTab("")).toBe("summary");
    expect(parseEventAdminTab("nope")).toBe("summary");
  });

  it("accepts every allowed tab id verbatim", () => {
    for (const tab of EVENT_ADMIN_TAB_ORDER) {
      expect(parseEventAdminTab(tab)).toBe(tab);
    }
  });
});

describe("AdminEventDetailTabs", () => {
  it("renders localized links and marks the current tab", () => {
    render(
      <AdminEventDetailTabs
        current="form"
        baseHref={baseHref}
        labels={{
          tabsAria: detail.tabsAria,
          tabs: detail.tabs,
          tabLeads: detail.tabLeads,
        }}
      >
        <p>panel-content</p>
      </AdminEventDetailTabs>,
    );

    for (const tab of EVENT_ADMIN_TAB_ORDER) {
      expect(screen.getByRole("link", { name: detail.tabs[tab] })).toBeInTheDocument();
    }

    const active = screen.getByRole("link", { name: detail.tabs.form });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveAttribute("href", `${baseHref}?tab=form`);
    expect(screen.getByText(detail.tabLeads.form)).toBeInTheDocument();
    expect(screen.getByText("panel-content")).toBeInTheDocument();
  });

  it("shows count badges for attendees and pending payments", () => {
    render(
      <AdminEventDetailTabs
        current="summary"
        baseHref={baseHref}
        counts={{ attendees: 12, payments: 3 }}
        labels={{
          tabsAria: detail.tabsAria,
          tabs: detail.tabs,
          tabLeads: detail.tabLeads,
        }}
      >
        <p>panel-content</p>
      </AdminEventDetailTabs>,
    );

    expect(screen.getByRole("link", { name: detail.tabs.attendees }).textContent).toContain("12");
    expect(screen.getByRole("link", { name: detail.tabs.payments }).textContent).toContain("3");
  });
});

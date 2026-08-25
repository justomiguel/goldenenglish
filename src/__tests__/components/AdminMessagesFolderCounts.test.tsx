import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import { AdminMessagesFolderCounts } from "@/components/dashboard/AdminMessagesFolderCounts";

describe("AdminMessagesFolderCounts", () => {
  it("shows four primary KPI cards for the whole mailbox", () => {
    render(
      <AdminMessagesFolderCounts
        locale="en"
        labels={en.admin.messages}
        shareOfTotal={en.admin.home.peopleStats.shareOfTotal}
        inbox={{ total: 3, unread: 2, needsReply: 1 }}
        sentTotal={5}
      />,
    );

    expect(screen.getByLabelText(en.admin.messages.countsSummaryAria)).toBeInTheDocument();
    expect(screen.getAllByText(en.admin.messages.countsReceivedLabel)).toHaveLength(1);
    expect(screen.getByText(en.admin.messages.countsUnreadLabel)).toBeInTheDocument();
    expect(screen.getByText(en.admin.messages.countsNeedsReplyLabel)).toBeInTheDocument();
    expect(screen.getAllByText(en.admin.messages.countsSentLabel)).toHaveLength(1);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    for (const value of ["3", "2", "1", "5"]) {
      const node = screen.getByText(value);
      expect(node.className).toContain("--color-primary");
      expect(node.className).not.toContain("--color-secondary");
    }
  });
});

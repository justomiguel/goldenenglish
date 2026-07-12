import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import { AdminMessagesFolderCounts } from "@/components/dashboard/AdminMessagesFolderCounts";

describe("AdminMessagesFolderCounts", () => {
  it("shows large numerals and short labels for inbox", () => {
    render(
      <AdminMessagesFolderCounts
        locale="en"
        labels={en.admin.messages}
        folder="inbox"
        counts={{ total: 3, unread: 2, needsReply: 1 }}
      />,
    );

    expect(screen.getByLabelText(en.admin.messages.countsSummaryAria)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(en.admin.messages.countsReceivedLabel)).toBeInTheDocument();
    expect(screen.getByText(en.admin.messages.countsUnreadLabel)).toBeInTheDocument();
    expect(screen.getByText(en.admin.messages.countsNeedsReplyLabel)).toBeInTheDocument();
  });

  it("shows only sent tile for sent folder", () => {
    render(
      <AdminMessagesFolderCounts
        locale="en"
        labels={en.admin.messages}
        folder="sent"
        counts={{ total: 5, unread: 0, needsReply: 0 }}
      />,
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(en.admin.messages.countsSentLabel)).toBeInTheDocument();
    expect(screen.queryByText(en.admin.messages.countsUnreadLabel)).not.toBeInTheDocument();
  });
});

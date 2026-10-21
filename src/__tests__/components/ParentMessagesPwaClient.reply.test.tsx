import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/dictionaries/en.json";
import { ParentMessagesPwaClient } from "@/components/pwa/organisms/ParentMessagesPwaClient";
import type { ParentMessageLineDto } from "@/components/parent/ParentMessagesFeed";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/en/dashboard/parent/messages",
}));

vi.mock("@/app/[locale]/dashboard/parent/messages/actions", () => ({
  sendParentMessage: vi.fn(),
  sendParentReply: vi.fn(),
}));

vi.mock("@/components/molecules/RichTextEditor", () => ({
  RichTextEditor: () => <div aria-label="editor" />,
}));

const labels = en.dashboard.parent;

const inbound: ParentMessageLineDto = {
  id: "m1",
  from_me: false,
  body_html: "<p>Please confirm.</p>",
  created_at: "2026-10-20T12:00:00.000Z",
  peer_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  peer_role: "teacher",
  peer_name: "Rojas Ana",
  incoming_label: "Teacher",
};

describe("ParentMessagesPwaClient reply", () => {
  it("shows the reply composer on the page when general compose is unavailable", async () => {
    const user = userEvent.setup();
    render(
      <ParentMessagesPwaClient
        locale="en"
        title="Messages"
        lead="Inbox"
        initialLines={[inbound]}
        recipients={[]}
        teacherComposeAvailable={false}
        administrationComposeAvailable={false}
        labels={labels}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.messagesReply }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.messagesReplySend })).toBeInTheDocument();
    expect(screen.getByText("This reply goes only to Rojas Ana.")).toBeInTheDocument();
  });

  it("shows the compose fields without a write button", () => {
    render(
      <ParentMessagesPwaClient
        locale="en"
        title="Messages"
        lead="Inbox"
        initialLines={[inbound]}
        recipients={[]}
        teacherComposeAvailable
        administrationComposeAvailable={false}
        labels={labels}
      />,
    );

    expect(screen.getByRole("button", { name: labels.messagesComposeSend })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.messagesWriteCta })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: labels.messagesFeedTitle })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Messages" })).not.toBeInTheDocument();
  });
});

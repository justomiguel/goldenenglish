import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/dictionaries/en.json";
import { ParentMessagesClient } from "@/components/parent/ParentMessagesClient";
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
  peer_role: "admin",
  peer_name: "Paz Luis",
  incoming_label: "Administration",
};

const outbound: ParentMessageLineDto = {
  ...inbound,
  id: "m2",
  from_me: true,
  peer_role: "teacher",
  outbound_administration: false,
};

describe("ParentMessagesClient reply", () => {
  it("opens a reply addressed only to the sender", async () => {
    const user = userEvent.setup();
    render(
      <ParentMessagesClient
        locale="en"
        initialLines={[inbound, outbound]}
        recipients={[]}
        teacherComposeAvailable={false}
        administrationComposeAvailable={false}
        labels={labels}
      />,
    );

    expect(screen.getAllByRole("button", { name: labels.messagesReply })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: labels.messagesReply }));
    expect(screen.getByRole("heading", { name: "Reply to Paz Luis" })).toBeInTheDocument();
    expect(screen.getByText("This reply goes only to Paz Luis.")).toBeInTheDocument();
  });
});

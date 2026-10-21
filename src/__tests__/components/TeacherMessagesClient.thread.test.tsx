import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/dictionaries/en.json";
import { TeacherMessagesClient } from "@/components/teacher/TeacherMessagesClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/teacher/messages/actions", () => ({
  sendTeacherMessage: vi.fn(),
  replyToStudentMessage: vi.fn(),
}));

vi.mock("@/components/molecules/RichTextEditor", () => ({
  RichTextEditor: () => <div aria-label="editor" />,
}));

const labels = en.dashboard.teacher;

describe("TeacherMessagesClient thread", () => {
  it("keeps one composer and moves reply into that bar", async () => {
    const user = userEvent.setup();
    render(
      <TeacherMessagesClient
        locale="en"
        layout="thread"
        labels={labels}
        recipients={[]}
        feedRows={[
          {
            id: "m1",
            created_at: "2026-10-20T12:00:00.000Z",
            body_html: "<p>Can I come?</p>",
            peerName: "Pérez Ana",
            peerRole: "student",
            isOutgoing: false,
            canReply: true,
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: labels.messagesComposeSend })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: labels.messagesFeedTitle })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: labels.messagesComposeTitle })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: labels.messagesReply }));
    expect(screen.getByRole("button", { name: labels.messagesSendReply })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.messagesComposeSend })).not.toBeInTheDocument();
  });
});
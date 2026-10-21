import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import { StudentMessagesClient } from "@/components/student/StudentMessagesClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/student/messages/actions", () => ({
  sendStudentMessage: vi.fn(),
  deleteStudentMessage: vi.fn(),
}));

vi.mock("@/components/molecules/RichTextEditor", () => ({
  RichTextEditor: () => <div aria-label="editor" />,
}));

const labels = en.dashboard.student;

describe("StudentMessagesClient thread", () => {
  it("pins the send control and skips the compose card heading", () => {
    render(
      <StudentMessagesClient
        locale="en"
        layout="thread"
        teacherComposeAvailable
        administrationComposeAvailable={false}
        labels={labels}
        initialLines={[
          {
            id: "m1",
            from_me: false,
            body_html: "<p>See you</p>",
            created_at: "2026-10-20T12:00:00.000Z",
            peer_name: "Rojas Ana",
            incoming_label: "Teacher",
            can_delete: false,
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: labels.messagesSend })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: labels.messagesCompose })).not.toBeInTheDocument();
    expect(screen.getByText("See you")).toBeInTheDocument();
  });
});

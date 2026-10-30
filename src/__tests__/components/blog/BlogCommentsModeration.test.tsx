import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlogCommentsModeration } from "@/components/dashboard/admin/cms/blog/BlogCommentsModeration";

vi.mock("@/app/[locale]/dashboard/admin/cms/blog/actions", () => ({
  moderateBlogCommentAdminAction: vi.fn(),
}));

const labels = {
  title: "Comments",
  empty: "Empty",
  hide: "Hide",
  show: "Show",
  flag: "Flag",
  approve: "Approve",
  pending: "Pending review",
};

const comment = {
  id: "c1",
  articleId: "a1",
  authorId: null,
  guestDisplayName: "Ada",
  parentCommentId: null,
  bodyText: "Hola",
  status: "pending" as const,
  createdAt: "2026-10-28T00:00:00.000Z",
  updatedAt: "2026-10-28T00:00:00.000Z",
};

describe("BlogCommentsModeration", () => {
  it("shows the guest email and an approve action", () => {
    render(
      <BlogCommentsModeration
        comments={[{ ...comment, guestEmail: "ada@example.com" }]}
        labels={labels}
      />,
    );
    expect(screen.getByText("ada@example.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Approve" })).toBeTruthy();
  });

  it("does not show an email line for an account comment", () => {
    render(
      <BlogCommentsModeration
        comments={[{ ...comment, authorId: "user-1", guestEmail: null, status: "visible" }]}
        labels={labels}
      />,
    );
    expect(screen.queryByText("ada@example.com")).toBeNull();
  });
});

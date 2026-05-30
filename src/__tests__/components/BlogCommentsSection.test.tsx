import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlogCommentsSection } from "@/components/organisms/BlogCommentsSection";

vi.mock("@/hooks/useBlogComments", () => ({
  useBlogComments: () => ({
    comments: [{ id: "c1", bodyText: "Hola", status: "visible" }],
    isLoading: false,
    error: null,
    createComment: vi.fn(),
    reportComment: vi.fn(),
  }),
}));

const labels = {
  title: "Comments",
  placeholder: "Write a comment",
  send: "Send",
  report: "Report",
  rateLimited: "Too many comments",
};

describe("BlogCommentsSection", () => {
  it("renders inline comment list and compose row for signed-in visitors", () => {
    render(<BlogCommentsSection articleId="article-1" labels={labels} />);

    expect(screen.getByText(labels.title)).toBeInTheDocument();
    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(labels.placeholder)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.send })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.report })).toBeInTheDocument();
  });
});

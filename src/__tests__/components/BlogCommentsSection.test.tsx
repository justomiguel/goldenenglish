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
  signInRequired: "Sign in to comment",
  report: "Report",
  rateLimited: "Too many comments",
};

describe("BlogCommentsSection", () => {
  it("hides compose UI when the visitor is not signed in", () => {
    render(
      <BlogCommentsSection
        articleId="article-1"
        canComment={false}
        signInHref="/es/login"
        signInLabel="Sign In"
        labels={labels}
      />,
    );

    expect(screen.queryByPlaceholderText(labels.placeholder)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.send })).not.toBeInTheDocument();
    expect(screen.getByText(labels.signInRequired)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: labels.signInLabel })).toHaveAttribute(
      "href",
      "/es/login",
    );
    expect(screen.queryByRole("button", { name: labels.report })).not.toBeInTheDocument();
  });

  it("shows compose UI when the visitor can comment", () => {
    render(
      <BlogCommentsSection
        articleId="article-1"
        canComment
        signInHref="/es/login"
        signInLabel="Sign In"
        labels={labels}
      />,
    );

    expect(screen.getByPlaceholderText(labels.placeholder)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.send })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.report })).toBeInTheDocument();
  });
});

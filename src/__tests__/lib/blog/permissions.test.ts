import { describe, expect, it } from "vitest";
import {
  canCreateArticle,
  canModerateComments,
  canReviewArticles,
  canWriteArticle,
} from "@/lib/blog/permissions";

describe("blog permissions", () => {
  it("allows only staff writers", () => {
    expect(canCreateArticle("admin")).toBe(true);
    expect(canCreateArticle("assistant")).toBe(true);
    expect(canCreateArticle("teacher")).toBe(true);
    expect(canCreateArticle("student")).toBe(false);
  });

  it("restricts moderation to admin and assistant", () => {
    expect(canReviewArticles("admin")).toBe(true);
    expect(canReviewArticles("assistant")).toBe(true);
    expect(canReviewArticles("teacher")).toBe(false);
    expect(canModerateComments("teacher")).toBe(false);
  });

  it("prevents teachers from publishing", () => {
    expect(
      canWriteArticle({
        actorRole: "teacher",
        actorId: "t-1",
        authorId: "t-1",
        nextStatus: "published",
      }),
    ).toBe(false);
  });

  it("allows assistant to publish", () => {
    expect(
      canWriteArticle({
        actorRole: "assistant",
        actorId: "a-1",
        authorId: "t-1",
        nextStatus: "published",
      }),
    ).toBe(true);
  });

  it("allows admin to edit any author draft", () => {
    expect(
      canWriteArticle({
        actorRole: "admin",
        actorId: "admin-1",
        authorId: "t-1",
        nextStatus: "draft",
      }),
    ).toBe(true);
  });

  it("allows teacher to edit own non-published article", () => {
    expect(
      canWriteArticle({
        actorRole: "teacher",
        actorId: "t-1",
        authorId: "t-1",
        nextStatus: "draft",
      }),
    ).toBe(true);
  });

  it("blocks teacher from editing another author's article", () => {
    expect(
      canWriteArticle({
        actorRole: "teacher",
        actorId: "t-1",
        authorId: "t-2",
        nextStatus: "draft",
      }),
    ).toBe(false);
  });

  it("blocks teacher from archiving own published article", () => {
    expect(
      canWriteArticle({
        actorRole: "teacher",
        actorId: "t-1",
        authorId: "t-1",
        nextStatus: "archived",
      }),
    ).toBe(false);
  });

  it("blocks parent from creating articles", () => {
    expect(canCreateArticle("parent")).toBe(false);
    expect(
      canWriteArticle({
        actorRole: "parent",
        actorId: "p-1",
        authorId: "p-1",
        nextStatus: "draft",
      }),
    ).toBe(false);
  });

  it("allows moderators to moderate comments", () => {
    expect(canModerateComments("admin")).toBe(true);
    expect(canModerateComments("assistant")).toBe(true);
  });
});

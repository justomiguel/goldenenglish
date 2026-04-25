/**
 * REGRESSION CHECK: learning tasks are the contract behind staff assignment,
 * student engagement, and tutor dashboards. These tests lock the pure rules so
 * future UI or Supabase refactors cannot weaken deep-copy, UTC late, upload, or
 * state-transition behavior.
 */
import { describe, expect, it } from "vitest";
import {
  InvalidStateTransitionException,
  assertTaskTransition,
  cloneTemplatePayload,
  normalizeVideoEmbedUrl,
  resolveCompletionStatus,
  validateLearningTaskFile,
  validateTaskDateRange,
} from "@/lib/learning-tasks";

describe("learning task domain rules", () => {
  it("deep-copies template payloads into independent task instances", () => {
    const cloned = cloneTemplatePayload({
      templateId: "template-1",
      title: "Lesson",
      bodyHtml: "<p>Study</p>",
      assets: [
        {
          id: "asset-1",
          kind: "file",
          label: "Guide",
          storagePath: "templates/template-1/guide.pdf",
          mimeType: "application/pdf",
          byteSize: 1000,
          sortOrder: 0,
        },
        {
          id: "asset-2",
          kind: "embed",
          label: "Video",
          embedProvider: "youtube",
          embedUrl: "https://www.youtube.com/embed/abc123",
          sortOrder: 1,
        },
      ],
    });

    expect(cloned.templateId).toBe("template-1");
    expect(cloned.assets[0]).toMatchObject({
      templateAssetId: "asset-1",
      storagePath: "templates/template-1/guide.pdf",
    });
    cloned.assets[0].label = "Changed on instance";
    expect(cloned.assets[0].label).not.toBe("Guide");
  });

  it("validates due date on or after start date", () => {
    expect(() =>
      validateTaskDateRange("2026-04-21T00:00:00Z", "2026-04-20T23:59:59Z"),
    ).toThrow("due_before_start");
  });

  it("calculates completed late with UTC instants", () => {
    expect(
      resolveCompletionStatus({
        currentStatus: "OPENED",
        dueAt: "2026-04-20T23:59:59Z",
        completedAt: "2026-04-21T00:00:01Z",
      }),
    ).toBe("COMPLETED_LATE");
  });

  it("rejects completing a task that has not been opened", () => {
    expect(() => assertTaskTransition("NOT_OPENED", "COMPLETED")).toThrow(
      InvalidStateTransitionException,
    );
  });

  it("blocks files larger than 50MB before network upload", () => {
    expect(
      validateLearningTaskFile({
        name: "large.pdf",
        size: 51 * 1024 * 1024,
        type: "application/pdf",
      }),
    ).toEqual({ ok: false, code: "file_too_large" });
  });

  it("normalizes YouTube and Vimeo URLs to embeddable URLs", () => {
    expect(normalizeVideoEmbedUrl("https://youtu.be/abc123")).toEqual({
      ok: true,
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/abc123",
    });
    expect(normalizeVideoEmbedUrl("https://vimeo.com/123456")).toEqual({
      ok: true,
      provider: "vimeo",
      embedUrl: "https://player.vimeo.com/video/123456",
    });
  });
});

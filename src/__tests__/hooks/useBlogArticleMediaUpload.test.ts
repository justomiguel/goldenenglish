import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  useBlogArticleMediaUpload,
  type BlogMediaUploadProgress,
} from "@/hooks/useBlogArticleMediaUpload";

function jpegFile(name = "pic.jpg") {
  return new File([new Uint8Array(8)], name, { type: "image/jpeg" });
}

describe("useBlogArticleMediaUpload", () => {
  it("opens a preparing snapshot and closes it after a successful upload", async () => {
    const uploadFile = vi.fn(
      async (
        _file: File,
        _articleId: string | undefined,
        onProgress: (progress: BlogMediaUploadProgress) => void,
      ) => {
        onProgress({ phase: "preparing", percent: null });
        onProgress({ phase: "uploading", percent: 40 });
        return { storagePath: "drafts/a.jpg" };
      },
    );
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useBlogArticleMediaUpload({
        articleId: "art-1",
        fileErrorLabel: "Bad file",
        onError,
        uploadFile,
      }),
    );

    let uploaded: { storagePath: string } | null = null;
    await act(async () => {
      uploaded = await result.current.uploadOne(jpegFile());
    });

    expect(uploaded).toEqual({ storagePath: "drafts/a.jpg" });
    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(result.current.snapshot).toBeNull();
    expect(result.current.isUploading).toBe(false);
    expect(onError).toHaveBeenCalledWith(null);
  });

  it("opens the snapshot at 0 percent before the signed-url request returns", async () => {
    const uploadFile = vi.fn(
      () =>
        new Promise<{ storagePath: string }>(() => {
          /* held open so we can inspect the first snapshot */
        }),
    );
    const { result } = renderHook(() =>
      useBlogArticleMediaUpload({
        fileErrorLabel: "Bad file",
        onError: vi.fn(),
        uploadFile,
      }),
    );

    act(() => {
      void result.current.uploadOne(jpegFile("clip.mp4"));
    });

    expect(result.current.snapshot).toEqual({
      filename: "clip.mp4",
      current: 1,
      total: 1,
      phase: "preparing",
      percent: 0,
    });
  });

  it("exposes the live snapshot while the upload is in flight", async () => {
    let finish!: (value: { storagePath: string }) => void;
    const uploadFile = vi.fn(
      async (
        _file: File,
        _articleId: string | undefined,
        onProgress: (progress: BlogMediaUploadProgress) => void,
      ) => {
        onProgress({ phase: "uploading", percent: 25 });
        return new Promise<{ storagePath: string }>((resolve) => {
          finish = resolve;
        });
      },
    );
    const { result } = renderHook(() =>
      useBlogArticleMediaUpload({
        fileErrorLabel: "Bad file",
        onError: vi.fn(),
        uploadFile,
      }),
    );

    let pending!: Promise<{ storagePath: string } | null>;
    act(() => {
      pending = result.current.uploadOne(jpegFile("clip.mp4"));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isUploading).toBe(true);
    expect(result.current.snapshot).toEqual({
      filename: "clip.mp4",
      current: 1,
      total: 1,
      phase: "uploading",
      percent: 25,
    });

    await act(async () => {
      finish({ storagePath: "drafts/clip.mp4" });
      await pending;
    });
    expect(result.current.snapshot).toBeNull();
  });

  it("closes the snapshot and reports an error when upload returns null", async () => {
    const onError = vi.fn();
    const uploadFile = vi.fn(async () => null);
    const { result } = renderHook(() =>
      useBlogArticleMediaUpload({
        fileErrorLabel: "Bad file",
        onError,
        uploadFile,
      }),
    );

    let uploaded: { storagePath: string } | null = "pending" as unknown as null;
    await act(async () => {
      uploaded = await result.current.uploadOne(jpegFile());
    });

    expect(uploaded).toBeNull();
    expect(result.current.snapshot).toBeNull();
    expect(onError).toHaveBeenCalledWith("Bad file");
  });

  it("does not open the modal for an invalid file", async () => {
    const onError = vi.fn();
    const uploadFile = vi.fn();
    const { result } = renderHook(() =>
      useBlogArticleMediaUpload({
        fileErrorLabel: "Bad file",
        onError,
        uploadFile,
      }),
    );

    await act(async () => {
      await result.current.uploadOne(new File([new Uint8Array(4)], "x.txt", { type: "text/plain" }));
    });

    expect(uploadFile).not.toHaveBeenCalled();
    expect(result.current.snapshot).toBeNull();
    expect(onError).toHaveBeenCalledWith("Bad file");
  });
});

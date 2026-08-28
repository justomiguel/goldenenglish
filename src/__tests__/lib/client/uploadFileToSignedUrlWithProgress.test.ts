import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadFileToSignedUrlWithProgress } from "@/lib/client/uploadFileToSignedUrlWithProgress";

type XhrHandlers = {
  onload: (() => void) | null;
  onerror: (() => void) | null;
  upload: { onprogress: ((ev: ProgressEvent<EventTarget>) => void) | null };
};

function mockXhr(setup: (xhr: XMLHttpRequest & XhrHandlers) => void) {
  const xhr = {
    status: 200,
    upload: { onprogress: null },
    onload: null,
    onerror: null,
    open: vi.fn(),
    send: vi.fn(),
    setRequestHeader: vi.fn(),
  } as unknown as XMLHttpRequest & XhrHandlers;
  setup(xhr);
  vi.stubGlobal(
    "XMLHttpRequest",
    vi.fn(function MockXHR(this: XMLHttpRequest) {
      return xhr;
    }) as unknown as typeof XMLHttpRequest,
  );
  return xhr;
}

describe("uploadFileToSignedUrlWithProgress", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports determinate percent then resolves on HTTP 2xx", async () => {
    const percents: number[] = [];
    const xhr = mockXhr((instance) => {
      instance.send = vi.fn(() => {
        instance.upload.onprogress?.({
          lengthComputable: true,
          loaded: 0,
          total: 100,
        } as ProgressEvent<EventTarget>);
        instance.upload.onprogress?.({
          lengthComputable: true,
          loaded: 50,
          total: 100,
        } as ProgressEvent<EventTarget>);
        instance.upload.onprogress?.({
          lengthComputable: true,
          loaded: 100,
          total: 100,
        } as ProgressEvent<EventTarget>);
        instance.status = 200;
        instance.onload?.();
      });
    });

    await uploadFileToSignedUrlWithProgress({
      supabaseUrl: "https://proj.supabase.co",
      bucket: "blog-media",
      storagePath: "drafts/user/a.jpg",
      token: "tok-1",
      file: new Blob(["hello"], { type: "image/jpeg" }),
      onProgress: (percent) => percents.push(percent),
    });

    expect(xhr.open).toHaveBeenCalledWith(
      "PUT",
      "https://proj.supabase.co/storage/v1/object/upload/sign/blog-media/drafts/user/a.jpg?token=tok-1",
    );
    expect(percents).toEqual([0, 0, 50, 100]);
  });

  it("rejects on HTTP 400", async () => {
    mockXhr((instance) => {
      instance.send = vi.fn(() => {
        instance.status = 400;
        instance.onload?.();
      });
    });

    await expect(
      uploadFileToSignedUrlWithProgress({
        supabaseUrl: "https://proj.supabase.co",
        bucket: "blog-media",
        storagePath: "drafts/user/a.jpg",
        token: "tok-1",
        file: new Blob(["hello"], { type: "image/jpeg" }),
      }),
    ).rejects.toThrow(/400/);
  });

  it("rejects on network error", async () => {
    mockXhr((instance) => {
      instance.send = vi.fn(() => {
        instance.onerror?.();
      });
    });

    await expect(
      uploadFileToSignedUrlWithProgress({
        supabaseUrl: "https://proj.supabase.co",
        bucket: "blog-media",
        storagePath: "drafts/user/a.jpg",
        token: "tok-1",
        file: new Blob(["hello"], { type: "image/jpeg" }),
      }),
    ).rejects.toThrow(/network/);
  });

  it("emits 0 percent before send so the bar is not stuck waiting", async () => {
    const percents: number[] = [];
    mockXhr((instance) => {
      instance.send = vi.fn(() => {
        expect(percents).toEqual([0]);
        instance.status = 200;
        instance.onload?.();
      });
    });

    await uploadFileToSignedUrlWithProgress({
      supabaseUrl: "https://proj.supabase.co",
      bucket: "blog-media",
      storagePath: "drafts/user/a.jpg",
      token: "tok-1",
      file: new Blob(["hello"], { type: "image/jpeg" }),
      onProgress: (percent) => percents.push(percent),
    });
  });

  it("does not emit determinate percent when total is 0, then reports 100 on success", async () => {
    const percents: number[] = [];
    mockXhr((instance) => {
      instance.send = vi.fn(() => {
        instance.upload.onprogress?.({
          lengthComputable: true,
          loaded: 10,
          total: 0,
        } as ProgressEvent<EventTarget>);
        instance.status = 201;
        instance.onload?.();
      });
    });

    await uploadFileToSignedUrlWithProgress({
      supabaseUrl: "https://proj.supabase.co",
      bucket: "blog-media",
      storagePath: "drafts/user/a.jpg",
      token: "tok-1",
      file: new Blob(["hello"], { type: "image/jpeg" }),
      onProgress: (percent) => percents.push(percent),
    });

    expect(percents).toEqual([0, 100]);
  });
});

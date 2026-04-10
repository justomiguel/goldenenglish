import "@testing-library/jest-dom/vitest";
import React, { type ImgHTMLAttributes, type ReactNode } from "react";
import { beforeEach, vi } from "vitest";
import {
  mockPathname,
  mockPush,
  mockRefresh,
  mockReplace,
} from "@/test/navigationMock";

if (typeof window !== "undefined") {
  if (typeof File !== "undefined" && !File.prototype.text) {
    File.prototype.text = function text(this: File) {
      return new Response(this as Blob).text();
    };
  }

  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList;
  }

  if (typeof HTMLDialogElement !== "undefined") {
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function showModal(
        this: HTMLDialogElement,
      ) {
        this.setAttribute("open", "");
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function close(
        this: HTMLDialogElement,
      ) {
        this.removeAttribute("open");
      };
    }
  }
}

vi.mock("next/image", () => ({
  default: function MockImage(
    props: ImgHTMLAttributes<HTMLImageElement> & { src: string },
  ) {
    const { src, alt = "", ...rest } = props;
    return React.createElement("img", { src, alt, ...rest });
  },
}));

vi.mock("next/link", () => ({
  default: function MockLink(props: {
    href: string;
    children?: ReactNode;
    className?: string;
    [k: string]: unknown;
  }) {
    const { href, children, ...rest } = props;
    return React.createElement("a", { href, ...rest }, children);
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  mockPathname.mockReset();
  mockPathname.mockReturnValue("/es");
  mockPush.mockClear();
  mockReplace.mockClear();
  mockRefresh.mockClear();
});

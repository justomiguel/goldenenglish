import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { Dictionary } from "@/types/i18n";
import { dictEn } from "@/test/dictEn";
import { LandingStudentGallery } from "@/components/molecules/LandingStudentGallery";

describe("LandingStudentGallery", () => {
  const dict: Dictionary = {
    ...dictEn,
    landing: {
      ...dictEn.landing,
      collage: {
        ...dictEn.landing.collage,
        alts: ["a", "b", "c", "d"],
      },
      studentGallery: {
        ...dictEn.landing.studentGallery,
        items: [
          {
            name: "Single",
            coverIndex: 0,
            photoIndexes: [0],
          },
          {
            name: "Multi",
            coverIndex: 1,
            photoIndexes: [1, 2],
          },
        ],
      },
    },
  };

  beforeEach(() => {
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens modal, closes on Escape and backdrop", async () => {
    render(<LandingStudentGallery dict={dict} />);
    fireEvent.click(screen.getByRole("button", { name: /Single/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Multi/ }));
    const overlay = screen.getByRole("presentation");
    fireEvent.click(overlay);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cycles slides with buttons and arrow keys when multiple photos", async () => {
    render(<LandingStudentGallery dict={dict} />);
    fireEvent.click(screen.getByRole("button", { name: /Multi/ }));
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: dict.landing.studentGallery.next }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "ArrowLeft", preventDefault: vi.fn() });
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("button", { name: dict.landing.studentGallery.previous }));
  });

  it("does not step when only one photo", () => {
    render(<LandingStudentGallery dict={dict} />);
    fireEvent.click(screen.getByRole("button", { name: /Single/ }));
    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
  });
});

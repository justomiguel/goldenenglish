/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { act, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useScrollEdgeFades } from "@/hooks/useScrollEdgeFades";

// REGRESSION CHECK: Tied to Modal body scroll affordances — overflow metrics must reflect scrollHeight vs clientHeight.

function Harness({ active }: { active: boolean }) {
  const { scrollRef, contentRef, showTopFade, showBottomFade, onScroll } =
    useScrollEdgeFades(active);
  return (
    <>
      <div
        ref={scrollRef}
        data-testid="scroller"
        onScroll={onScroll}
        style={{ height: 100, overflow: "auto", width: "100%" }}
      >
        <div ref={contentRef} style={{ height: 400 }} />
      </div>
      <span data-testid="flags">
        {String(showTopFade)}|{String(showBottomFade)}
      </span>
    </>
  );
}

describe("useScrollEdgeFades", () => {
  it("hides both fades when inactive", () => {
    render(<Harness active={false} />);
    expect(screen.getByTestId("flags").textContent).toBe("false|false");
  });

  it("hides fades when scroll area has no overflow", async () => {
    render(<Harness active />);
    const scroller = screen.getByTestId("scroller");
    Object.defineProperty(scroller, "scrollHeight", {
      configurable: true,
      get: () => 100,
    });
    Object.defineProperty(scroller, "clientHeight", {
      configurable: true,
      get: () => 100,
    });
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("flags").textContent).toBe("false|false");
    });
  });

  it("clears fades when deactivated after overflow", async () => {
    const { rerender } = render(<Harness active />);
    const scroller = screen.getByTestId("scroller");
    let scrollTop = 0;
    Object.defineProperty(scroller, "scrollHeight", {
      configurable: true,
      value: 400,
      writable: false,
    });
    Object.defineProperty(scroller, "clientHeight", {
      configurable: true,
      value: 100,
      writable: false,
    });
    Object.defineProperty(scroller, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
      set: (v: number) => {
        scrollTop = v;
      },
    });
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("flags").textContent).toBe("false|true");
    });
    rerender(<Harness active={false} />);
    expect(screen.getByTestId("flags").textContent).toBe("false|false");
  });

  it("shows bottom fade when content overflows and top after scroll down", async () => {
    render(<Harness active />);
    const scroller = screen.getByTestId("scroller");
    let scrollTop = 0;
    Object.defineProperty(scroller, "scrollHeight", {
      configurable: true,
      value: 400,
      writable: false,
    });
    Object.defineProperty(scroller, "clientHeight", {
      configurable: true,
      value: 100,
      writable: false,
    });
    Object.defineProperty(scroller, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
      set: (v: number) => {
        scrollTop = v;
      },
    });

    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("flags").textContent).toBe("false|true");
    });

    scrollTop = 200;
    fireEvent.scroll(scroller);

    await waitFor(() => {
      expect(screen.getByTestId("flags").textContent).toBe("true|true");
    });

    scrollTop = 300;
    fireEvent.scroll(scroller);

    await waitFor(() => {
      expect(screen.getByTestId("flags").textContent).toBe("true|false");
    });
  });
});

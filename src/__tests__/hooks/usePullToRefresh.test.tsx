import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { usePullToRefresh, PULL_TO_REFRESH_THRESHOLD_PX } from "@/hooks/usePullToRefresh";

// REGRESSION CHECK: this gesture sits on the installed-app scroll container. Losing the
// top-of-page guard, the vertical-dominance guard, or the `enabled` gate would hijack normal
// scrolling and horizontal swipes across every parent/student screen.

function Harness({
  onRefresh,
  enabled = true,
}: {
  onRefresh: () => void | Promise<void>;
  enabled?: boolean;
}) {
  const { distance, phase, ref } = usePullToRefresh({ onRefresh, enabled });
  return (
    <div ref={ref} data-testid="area">
      <span data-testid="phase">{phase}</span>
      <span data-testid="distance">{Math.round(distance)}</span>
    </div>
  );
}

function touch(clientX: number, clientY: number) {
  return { touches: [{ clientX, clientY }] };
}

function area() {
  return screen.getByTestId("area");
}

function phase() {
  return screen.getByTestId("phase").textContent;
}

const BEYOND_THRESHOLD = PULL_TO_REFRESH_THRESHOLD_PX + 40;

beforeEach(() => {
  Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePullToRefresh", () => {
  it("stays idle until the finger travels past the direction lock", () => {
    render(<Harness onRefresh={vi.fn()} />);

    fireEvent.touchStart(area(), touch(10, 100));
    fireEvent.touchMove(area(), touch(10, 104));

    expect(phase()).toBe("idle");
  });

  it("arms once the pull passes the threshold and refreshes on release", async () => {
    const onRefresh = vi.fn();
    render(<Harness onRefresh={onRefresh} />);

    fireEvent.touchStart(area(), touch(10, 100));
    fireEvent.touchMove(area(), touch(10, 100 + BEYOND_THRESHOLD));
    expect(phase()).toBe("armed");

    await act(async () => {
      fireEvent.touchEnd(area());
      await Promise.resolve();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when released below the threshold", () => {
    const onRefresh = vi.fn();
    render(<Harness onRefresh={onRefresh} />);

    fireEvent.touchStart(area(), touch(10, 100));
    fireEvent.touchMove(area(), touch(10, 130));
    expect(phase()).toBe("pulling");

    fireEvent.touchEnd(area());

    expect(onRefresh).not.toHaveBeenCalled();
    expect(phase()).toBe("idle");
  });

  it("ignores gestures that start away from the top of the page", () => {
    Object.defineProperty(window, "scrollY", { value: 240, writable: true, configurable: true });
    const onRefresh = vi.fn();
    render(<Harness onRefresh={onRefresh} />);

    fireEvent.touchStart(area(), touch(10, 100));
    fireEvent.touchMove(area(), touch(10, 100 + BEYOND_THRESHOLD));
    fireEvent.touchEnd(area());

    expect(phase()).toBe("idle");
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("releases horizontal-dominant swipes back to the page", () => {
    const onRefresh = vi.fn();
    render(<Harness onRefresh={onRefresh} />);

    fireEvent.touchStart(area(), touch(10, 100));
    fireEvent.touchMove(area(), touch(200, 120));
    fireEvent.touchMove(area(), touch(200, 100 + BEYOND_THRESHOLD));
    fireEvent.touchEnd(area());

    expect(phase()).toBe("idle");
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("damps travel beyond the threshold instead of tracking the finger 1:1", () => {
    render(<Harness onRefresh={vi.fn()} />);

    fireEvent.touchStart(area(), touch(10, 100));
    fireEvent.touchMove(area(), touch(10, 100 + 300));

    const distance = Number(screen.getByTestId("distance").textContent);
    expect(distance).toBeGreaterThanOrEqual(PULL_TO_REFRESH_THRESHOLD_PX);
    expect(distance).toBeLessThan(300);
  });

  it("does nothing at all when disabled", () => {
    const onRefresh = vi.fn();
    render(<Harness onRefresh={onRefresh} enabled={false} />);

    fireEvent.touchStart(area(), touch(10, 100));
    fireEvent.touchMove(area(), touch(10, 100 + BEYOND_THRESHOLD));
    fireEvent.touchEnd(area());

    expect(phase()).toBe("idle");
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("ignores multi-touch gestures such as pinch to zoom", () => {
    const onRefresh = vi.fn();
    render(<Harness onRefresh={onRefresh} />);

    fireEvent.touchStart(area(), {
      touches: [
        { clientX: 10, clientY: 100 },
        { clientX: 40, clientY: 100 },
      ],
    });
    fireEvent.touchMove(area(), touch(10, 100 + BEYOND_THRESHOLD));
    fireEvent.touchEnd(area());

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("returns to idle after an async refresh settles", async () => {
    let resolveRefresh: (() => void) | undefined;
    const onRefresh = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    render(<Harness onRefresh={onRefresh} />);

    fireEvent.touchStart(area(), touch(10, 100));
    fireEvent.touchMove(area(), touch(10, 100 + BEYOND_THRESHOLD));
    fireEvent.touchEnd(area());

    expect(phase()).toBe("refreshing");

    await act(async () => {
      resolveRefresh?.();
      await Promise.resolve();
    });

    expect(phase()).toBe("idle");
  });
});

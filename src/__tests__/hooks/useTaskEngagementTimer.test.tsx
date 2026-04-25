/**
 * REGRESSION CHECK: accidental clicks must not award engagement. The timer only
 * fires after the task stays visible and focused for the required dwell time.
 */
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTaskEngagementTimer } from "@/hooks/useTaskEngagementTimer";

function Harness({ onEngaged }: { onEngaged: () => void }) {
  useTaskEngagementTimer({ enabled: true, delayMs: 5000, onEngaged });
  return <div>task</div>;
}

describe("useTaskEngagementTimer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits for more than five seconds before firing engagement", () => {
    vi.useFakeTimers();
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    const onEngaged = vi.fn();
    render(<Harness onEngaged={onEngaged} />);

    vi.advanceTimersByTime(4900);
    expect(onEngaged).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(onEngaged).toHaveBeenCalledTimes(1);
  });
});

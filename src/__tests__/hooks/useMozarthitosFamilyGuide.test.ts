// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import es from "@/dictionaries/es.json";

const routerMock = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/es/encuentra-tu-clase",
}));

import { useMozarthitosFamilyGuide } from "@/hooks/useMozarthitosFamilyGuide";

function setup(initial = { ageBand: null, attendance: null } as const) {
  return renderHook(() =>
    useMozarthitosFamilyGuide({
      locale: "es",
      labels: es.landing.mz.guide,
      place: "Sede",
      initial: { ...initial },
    }),
  );
}

describe("useMozarthitosFamilyGuide", () => {
  beforeEach(() => routerMock.replace.mockClear());

  it("walks age, then attendance, then result and writes the query", () => {
    const { result } = setup();
    expect(result.current.data.step).toBe("age");
    act(() => result.current.handlers.chooseAge("3y_4y"));
    expect(result.current.data.step).toBe("attendance");
    expect(result.current.data.stepNumber).toBe(2);
    expect(routerMock.replace).toHaveBeenLastCalledWith("/es/encuentra-tu-clase?edad=3y_4y", {
      scroll: false,
    });
    act(() => result.current.handlers.chooseAttendance("remote"));
    expect(result.current.data.step).toBe("result");
    expect(result.current.data.view?.kind).toBe("recommendation");
    expect(routerMock.replace).toHaveBeenLastCalledWith(
      "/es/encuentra-tu-clase?edad=3y_4y&modalidad=remote",
      { scroll: false },
    );
  });

  it("keeps a preset attendance and goes straight to the result after the age", () => {
    const { result } = setup({ ageBand: null, attendance: "remote" } as never);
    act(() => result.current.handlers.chooseAge("6m_2y"));
    expect(result.current.data.step).toBe("result");
  });

  it("back from the result clears attendance; restart clears both", () => {
    const { result } = setup({ ageBand: "8y_plus", attendance: "in_person" } as never);
    act(() => result.current.handlers.back());
    expect(result.current.data.step).toBe("attendance");
    act(() => result.current.handlers.back());
    expect(result.current.data.step).toBe("age");
    act(() => result.current.handlers.chooseAge("adult"));
    act(() => result.current.handlers.restart());
    expect(result.current.data.answers).toEqual({ ageBand: null, attendance: null });
    expect(routerMock.replace).toHaveBeenLastCalledWith("/es/encuentra-tu-clase", { scroll: false });
  });
});

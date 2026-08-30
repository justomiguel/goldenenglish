import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useClientTableSort } from "@/hooks/useClientTableSort";

describe("useClientTableSort", () => {
  const rows = [
    { name: "Zoe", amount: 3 },
    { name: "Ana", amount: 10 },
  ];

  it("sorts by the default key and toggles direction", () => {
    const { result } = renderHook(() =>
      useClientTableSort(
        rows,
        {
          name: (row) => row.name,
          amount: (row) => row.amount,
        },
        "name",
      ),
    );

    expect(result.current.sortedRows.map((row) => row.name)).toEqual(["Ana", "Zoe"]);

    act(() => {
      result.current.onToggleSort("name");
    });
    expect(result.current.sortDir).toBe("desc");
    expect(result.current.sortedRows.map((row) => row.name)).toEqual(["Zoe", "Ana"]);

    act(() => {
      result.current.onToggleSort("amount");
    });
    expect(result.current.sortKey).toBe("amount");
    expect(result.current.sortDir).toBe("asc");
    expect(result.current.sortedRows.map((row) => row.amount)).toEqual([3, 10]);
  });
});

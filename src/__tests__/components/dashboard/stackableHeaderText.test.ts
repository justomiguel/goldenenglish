import { describe, expect, it } from "vitest";
import { stackableHeaderText } from "@/components/dashboard/AdminStackableTableLabels";

describe("stackableHeaderText", () => {
  it("keeps the column name and drops the sort hint", () => {
    const cell = document.createElement("th");
    cell.innerHTML =
      '<button type="button"><span>Fecha</span><span class="sr-only">sin orden en esta columna</span></button>';

    expect(stackableHeaderText(cell)).toBe("Fecha");
  });
});

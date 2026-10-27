import { describe, expect, it } from "vitest";
import {
  labelStackableTables,
  stackableHeaderText,
} from "@/components/dashboard/AdminStackableTableLabels";

// REGRESSION CHECK: Stackable table labels must skip colSpan > 1 rows and empty header columns on mobile cards.
describe("stackableHeaderText", () => {
  it("keeps the column name and drops the sort hint", () => {
    const cell = document.createElement("th");
    cell.innerHTML =
      '<button type="button"><span>Fecha</span><span class="sr-only">sin orden en esta columna</span></button>';

    expect(stackableHeaderText(cell)).toBe("Fecha");
  });

  it("skips colSpan cells and empty header columns when stamping data-label", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <table class="ge-stack-cards">
        <thead>
          <tr>
            <th><span class="sr-only">Seleccionar</span></th>
            <th>Alumno</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr id="data-row">
            <td><input type="checkbox" /></td>
            <td>Ana Pérez</td>
            <td>Activo</td>
          </tr>
          <tr id="empty-row">
            <td colspan="3">Sin resultados</td>
          </tr>
        </tbody>
      </table>
    `;

    labelStackableTables(root);

    const dataCells = root.querySelectorAll("#data-row > td");
    expect(dataCells[0]?.getAttribute("data-label")).toBeNull();
    expect(dataCells[1]?.getAttribute("data-label")).toBe("Alumno");
    expect(dataCells[2]?.getAttribute("data-label")).toBe("Estado");

    const emptyCell = root.querySelector("#empty-row > td");
    expect(emptyCell?.getAttribute("data-label")).toBeNull();
  });
});

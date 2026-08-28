import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  ADMIN_SURFACE_ICON_IDS,
  adminSurfaceIcon,
  type AdminSurfaceIconId,
} from "@/lib/dashboard/adminSurfaceIcon";

describe("adminSurfaceIcon", () => {
  it("returns a node for every mapped destination", () => {
    for (const id of ADMIN_SURFACE_ICON_IDS) {
      const { container, unmount } = render(<>{adminSurfaceIcon(id)}</>);
      expect(container.querySelector("svg")).not.toBeNull();
      unmount();
    }
  });

  it("returns null for an unknown id", () => {
    expect(adminSurfaceIcon("not-an-icon" as AdminSurfaceIconId)).toBeNull();
  });

  it("gives Alumnos, Profesores and Usuarios distinct icons", () => {
    const marks = (["students", "teachers", "allAccounts"] as const).map((id) => {
      const { container, unmount } = render(<>{adminSurfaceIcon(id)}</>);
      const mark = container.querySelector("svg")?.innerHTML ?? "";
      unmount();
      return mark;
    });
    expect(new Set(marks).size).toBe(3);
  });
});

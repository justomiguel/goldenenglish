// REGRESSION CHECK: Parent Help FAB must never render (admin + desktop only).
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParentHelpLauncher } from "@/components/dashboard/ParentHelpLauncher";

describe("ParentHelpLauncher", () => {
  it("does not render a help FAB", () => {
    render(
      <ParentHelpLauncher
        locale="es"
        launcherDict={{
          fabAria: "Open family help",
          fabTitle: "Help",
          helpTitle: "Family help",
          panelDesc: "Panel desc",
          closePanel: "Close help panel",
        }}
        catalogDict={{} as never}
        toursDict={{} as never}
        explainScreenDict={{} as never}
        screenToursDict={{} as never}
      />,
    );
    expect(screen.queryByRole("button", { name: "Open family help" })).toBeNull();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminHubCardActions } from "@/components/dashboard/AdminHubCardActions";
import { dictEn } from "@/test/dictEn";

describe("AdminHubCardActions", () => {
  it("keeps a traffic size under large disabled", () => {
    render(
      <AdminHubCardActions
        id="traffic"
        labels={dictEn.admin.home.layout}
        onSize={() => undefined}
        onMove={() => undefined}
        onHide={() => undefined}
      />,
    );
    expect(screen.getByRole("menuitemradio", { name: dictEn.admin.home.layout.sizeSmall })).toBeDisabled();
    expect(screen.getByRole("menuitemradio", { name: dictEn.admin.home.layout.sizeMedium })).toBeDisabled();
    expect(screen.getByRole("menuitemradio", { name: dictEn.admin.home.layout.sizeLarge })).toBeEnabled();
    expect(screen.getByText(dictEn.admin.home.layout.sizeLockedTraffic)).toBeTruthy();
    expect(screen.getByText(dictEn.admin.home.layout.sizeSection)).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: dictEn.admin.home.layout.moveUp })).toBeTruthy();
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  usePathname: () => "/es",
  useRouter: () => ({ refresh: vi.fn() }),
}));

const { setKindMock } = vi.hoisted(() => ({
  setKindMock: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/cms/setSiteThemeKindAction", () => ({
  setSiteThemeKindAction: setKindMock,
}));

import { LandingTemplateKindPicker } from "@/components/dashboard/admin/cms/LandingTemplateKindPicker";

const labels = dictEn.admin.cms.templates.landing.kindPicker;

beforeEach(() => {
  setKindMock.mockReset();
});

describe("LandingTemplateKindPicker", () => {
  it("renders one radio per supported kind", () => {
    render(
      <LandingTemplateKindPicker
        locale="en"
        themeId="00000000-0000-4000-8000-000000000099"
        current="classic"
        labels={labels}
      />,
    );
    expect(
      screen.getByRole("radio", { name: labels.options.classic }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: labels.options.editorial }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: labels.options.minimal }),
    ).toBeInTheDocument();
  });

  it("can switch to the minimal kind", async () => {
    setKindMock.mockResolvedValueOnce({ ok: true });
    render(
      <LandingTemplateKindPicker
        locale="en"
        themeId="00000000-0000-4000-8000-000000000099"
        current="classic"
        labels={labels}
      />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("radio", { name: labels.options.minimal }),
      );
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.saveCta }));
    });
    expect(setKindMock).toHaveBeenCalledWith({
      locale: "en",
      id: "00000000-0000-4000-8000-000000000099",
      kind: "minimal",
    });
  });

  it("disables save until a different kind is picked", () => {
    render(
      <LandingTemplateKindPicker
        locale="en"
        themeId="00000000-0000-4000-8000-000000000099"
        current="classic"
        labels={labels}
      />,
    );
    const button = screen.getByRole("button", { name: labels.saveCta });
    expect(button).toBeDisabled();
  });

  it("calls the action with the new kind and shows success", async () => {
    setKindMock.mockResolvedValueOnce({ ok: true });
    render(
      <LandingTemplateKindPicker
        locale="en"
        themeId="00000000-0000-4000-8000-000000000099"
        current="classic"
        labels={labels}
      />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("radio", { name: labels.options.editorial }),
      );
    });
    const button = screen.getByRole("button", { name: labels.saveCta });
    expect(button).not.toBeDisabled();
    await act(async () => {
      fireEvent.click(button);
    });
    expect(setKindMock).toHaveBeenCalledWith({
      locale: "en",
      id: "00000000-0000-4000-8000-000000000099",
      kind: "editorial",
    });
    expect(screen.getByRole("status")).toHaveTextContent(labels.saveSuccess);
  });

  it("renders an error alert when the action fails", async () => {
    setKindMock.mockResolvedValueOnce({ ok: false, code: "persist_failed" });
    render(
      <LandingTemplateKindPicker
        locale="en"
        themeId="00000000-0000-4000-8000-000000000099"
        current="classic"
        labels={labels}
      />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("radio", { name: labels.options.editorial }),
      );
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.saveCta }));
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      labels.errors.persist_failed,
    );
  });

  it("shows the exclusive-template sentence and its code", async () => {
    setKindMock.mockResolvedValueOnce({ ok: false, code: "kind_not_available" });
    render(
      <LandingTemplateKindPicker
        locale="en"
        themeId="00000000-0000-4000-8000-000000000099"
        current="classic"
        labels={labels}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: labels.options.editorial }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.saveCta }));
    });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(`${labels.errors.persist_failed} (kind_not_available)`);
    expect(alert.textContent).not.toBe(labels.errors.persist_failed);
  });

  it("shows an unknown code in the alert", async () => {
    setKindMock.mockResolvedValueOnce({ ok: false, code: "mystery_code" });
    render(
      <LandingTemplateKindPicker
        locale="en"
        themeId="00000000-0000-4000-8000-000000000099"
        current="classic"
        labels={labels}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: labels.options.editorial }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.saveCta }));
    });
    expect(screen.getByRole("alert")).toHaveTextContent("mystery_code");
  });
});

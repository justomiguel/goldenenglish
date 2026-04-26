import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { dictEn } from "@/test/dictEn";
import type { LandingBlock } from "@/types/theming";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const { addMock, updateMock, removeMock, moveMock } = vi.hoisted(() => ({
  addMock: vi.fn(),
  updateMock: vi.fn(),
  removeMock: vi.fn(),
  moveMock: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/cms/siteThemeBlocksActions", () => ({
  addLandingBlockAction: addMock,
  updateLandingBlockAction: updateMock,
  removeLandingBlockAction: removeMock,
  moveLandingBlockAction: moveMock,
  setSiteThemeKindAction: vi.fn(),
}));

import { LandingBlocksPanel } from "@/components/dashboard/admin/cms/LandingBlocksPanel";

const labels = dictEn.admin.cms.templates.landing.blocks;
const themeId = "00000000-0000-4000-8000-000000000050";

beforeEach(() => {
  addMock.mockReset();
  updateMock.mockReset();
  removeMock.mockReset();
  moveMock.mockReset();
});

describe("LandingBlocksPanel", () => {
  it("shows the empty state when no blocks exist", () => {
    render(
      <LandingBlocksPanel
        locale="en"
        themeId={themeId}
        section="inicio"
        blocks={[]}
        labels={labels}
      />,
    );
    expect(screen.getByText(labels.emptyState)).toBeInTheDocument();
  });

  it("validates that the new block has at least one copy field", async () => {
    render(
      <LandingBlocksPanel
        locale="en"
        themeId={themeId}
        section="inicio"
        blocks={[]}
        labels={labels}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.addCta }));
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: labels.submitAddCta }),
      );
    });
    expect(screen.getByRole("alert")).toHaveTextContent(labels.blockEmpty);
    expect(addMock).not.toHaveBeenCalled();
  });

  it("submits a new block when copy is provided", async () => {
    addMock.mockResolvedValueOnce({ ok: true });
    render(
      <LandingBlocksPanel
        locale="en"
        themeId={themeId}
        section="historia"
        blocks={[]}
        labels={labels}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.addCta }));
    });
    await act(async () => {
      fireEvent.change(
        screen.getByLabelText(labels.titleEsLabel),
        { target: { value: "Subsección" } },
      );
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: labels.submitAddCta }),
      );
    });
    expect(addMock).toHaveBeenCalledWith({
      locale: "en",
      id: themeId,
      section: "historia",
      kind: "card",
      copy: {
        es: { title: "Subsección", body: undefined },
        en: { title: undefined, body: undefined },
      },
    });
  });

  it("renders existing blocks and triggers remove with confirmation", async () => {
    const block: LandingBlock = {
      id: "00000000-0000-4000-8000-000000000999",
      section: "inicio",
      kind: "card",
      position: 1,
      copy: {
        es: { title: "Hola" },
        en: { title: "Hello" },
      },
    };
    removeMock.mockResolvedValueOnce({ ok: true });
    render(
      <LandingBlocksPanel
        locale="en"
        themeId={themeId}
        section="inicio"
        blocks={[block]}
        labels={labels}
      />,
    );
    expect(screen.getByDisplayValue("Hola")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.removeCta }));
    });
    const dialog = screen.getByRole("dialog");
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole("button", { name: labels.removeModalConfirm }),
      );
    });
    expect(removeMock).toHaveBeenCalledWith({
      locale: "en",
      id: themeId,
      blockId: block.id,
    });
  });

  it("invokes moveLandingBlockAction when the down arrow is clicked", async () => {
    const blocks: LandingBlock[] = [
      {
        id: "00000000-0000-4000-8000-000000000001",
        section: "inicio",
        kind: "card",
        position: 0,
        copy: { es: { title: "Uno" }, en: {} },
      },
      {
        id: "00000000-0000-4000-8000-000000000002",
        section: "inicio",
        kind: "card",
        position: 1,
        copy: { es: { title: "Dos" }, en: {} },
      },
    ];
    moveMock.mockResolvedValueOnce({ ok: true });
    render(
      <LandingBlocksPanel
        locale="en"
        themeId={themeId}
        section="inicio"
        blocks={blocks}
        labels={labels}
      />,
    );
    const downButtons = screen.getAllByRole("button", {
      name: labels.moveDownCta,
    });
    expect(downButtons[0]).not.toBeDisabled();
    expect(downButtons[1]).toBeDisabled();
    await act(async () => {
      fireEvent.click(downButtons[0]!);
    });
    expect(moveMock).toHaveBeenCalledWith({
      locale: "en",
      id: themeId,
      blockId: blocks[0]!.id,
      direction: 1,
    });
  });

  it("hides body fields when divider kind is selected in the add form", async () => {
    render(
      <LandingBlocksPanel
        locale="en"
        themeId={themeId}
        section="inicio"
        blocks={[]}
        labels={labels}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.addCta }));
    });
    expect(screen.getByLabelText(labels.bodyEsLabel)).toBeInTheDocument();
    await act(async () => {
      fireEvent.change(screen.getByLabelText(labels.kindLabel), {
        target: { value: "divider" },
      });
    });
    expect(screen.getByLabelText(labels.titleEsLabel)).toBeInTheDocument();
    expect(screen.queryByLabelText(labels.bodyEsLabel)).toBeNull();
    expect(screen.queryByLabelText(labels.bodyEnLabel)).toBeNull();
  });

  it("hides body fields on the editor row of an existing divider block", () => {
    const dividerBlock: LandingBlock = {
      id: "00000000-0000-4000-8000-0000000000aa",
      section: "inicio",
      kind: "divider",
      position: 0,
      copy: { es: { title: "Capítulo II" }, en: {} },
    };
    render(
      <LandingBlocksPanel
        locale="en"
        themeId={themeId}
        section="inicio"
        blocks={[dividerBlock]}
        labels={labels}
      />,
    );
    expect(screen.getByDisplayValue("Capítulo II")).toBeInTheDocument();
    expect(screen.queryByLabelText(labels.bodyEsLabel)).toBeNull();
  });

  it("disables the up arrow on the first row", () => {
    const block: LandingBlock = {
      id: "00000000-0000-4000-8000-000000000003",
      section: "inicio",
      kind: "card",
      position: 0,
      copy: { es: { title: "Solo" }, en: {} },
    };
    render(
      <LandingBlocksPanel
        locale="en"
        themeId={themeId}
        section="inicio"
        blocks={[block]}
        labels={labels}
      />,
    );
    expect(
      screen.getByRole("button", { name: labels.moveUpCta }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: labels.moveDownCta }),
    ).toBeDisabled();
  });
});

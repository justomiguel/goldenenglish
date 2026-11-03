// REGRESSION CHECK: Template picker shows a real page screenshot, not a drawn miniature.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { createOwnerSiteAction } from "@/app/[locale]/cuenta/actions";
import { PulsarAccountCreateForm } from "@/components/organisms/pulsar/PulsarAccountCreateForm";
import { GENERIC_INSTITUTE_KINDS } from "@/lib/theme/genericInstituteTemplates";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/es/cuenta/nuevo",
}));

vi.mock("@/app/[locale]/cuenta/actions", () => ({
  createOwnerSiteAction: vi.fn(),
}));

const dict = es as unknown as Dictionary;
const createMock = vi.mocked(createOwnerSiteAction);

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        status: "running",
        current: 2,
        total: 8,
        message: "migration",
        fileName: "010_example.sql",
        activity: [{ code: "migration", meta: { file: "001_init.sql" } }],
      }),
    ),
  );
});

describe("PulsarAccountCreateForm", () => {
  it("shows a captured page for each template and the blank-domain note", async () => {
    const previews = GENERIC_INSTITUTE_KINDS.map((kind) => {
      const landing = dict.landing.genericLandings[kind];
      return {
        kind,
        name: landing.name,
        alt: dict.pulsar.account.templatePreviewAlt.replaceAll("{name}", landing.name),
        src: `/generic/${kind}/preview.jpg`,
      };
    });
    render(
      <PulsarAccountCreateForm
        locale="es"
        copy={dict.pulsar.account}
        brandName={dict.pulsar.meta.brandName}
        previews={previews}
      />,
    );

    expect(screen.getByRole("heading", { name: dict.pulsar.account.createTitle })).toBeInTheDocument();
    expect(
      screen.getByText(
        dict.pulsar.account.customDomainNote.replaceAll("{brand}", dict.pulsar.meta.brandName),
      ),
    ).toBeInTheDocument();
    for (const preview of previews) {
      expect(screen.getByRole("img", { name: preview.alt })).toHaveAttribute("src", preview.src);
    }
    await userEvent.click(screen.getAllByRole("button", { name: dict.pulsar.account.templateEnlarge })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.querySelector("iframe")).toHaveAttribute(
      "src",
      expect.stringContaining("/es/plantilla/deportes?"),
    );
    expect(screen.getByRole("progressbar", { name: dict.pulsar.account.templatePreviewLoading })).toBeInTheDocument();
    fireEvent.load(document.querySelector("iframe") as HTMLIFrameElement);
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText(dict.pulsar.account.templateColorPrimary)).toBeInTheDocument();
    expect(screen.getByLabelText(dict.pulsar.account.shareAddress)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.account.shareHint)).toBeInTheDocument();
  });

  it("sends the selected template and names a field error", async () => {
    let finish: (value: { ok: false; errorCode: string }) => void = () => undefined;
    createMock.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const previews = GENERIC_INSTITUTE_KINDS.map((kind) => {
      const landing = dict.landing.genericLandings[kind];
      return {
        kind,
        name: landing.name,
        alt: dict.pulsar.account.templatePreviewAlt.replaceAll("{name}", landing.name),
        src: `/generic/${kind}/preview.jpg`,
      };
    });
    render(
      <PulsarAccountCreateForm
        locale="es"
        copy={dict.pulsar.account}
        brandName={dict.pulsar.meta.brandName}
        previews={previews}
      />,
    );
    await userEvent.type(screen.getByLabelText(dict.pulsar.account.displayName), "Club Norte");
    await userEvent.type(screen.getByLabelText(dict.pulsar.account.slug), "club-norte");
    const submitted = userEvent.click(screen.getByRole("button", { name: dict.pulsar.account.submitCreate }));
    expect(await screen.findByRole("heading", { name: dict.pulsar.account.provision.title })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/cuenta/schema-provision?schema=tenant_club_norte"));
    finish({ ok: false, errorCode: "invalid_input" });
    await submitted;
    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "deportes", slug: "club-norte", displayName: "Club Norte" }),
      );
    });
    expect(screen.getByText(dict.pulsar.account.checkFields)).toBeInTheDocument();
  });
});

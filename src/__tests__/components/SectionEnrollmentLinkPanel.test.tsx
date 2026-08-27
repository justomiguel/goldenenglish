import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const generate = vi.fn();
const setActive = vi.fn();
const rotate = vi.fn();
const refresh = vi.fn();

vi.mock(
  "@/app/[locale]/dashboard/teacher/sections/[sectionId]/enrollmentLinkActions",
  () => ({
    generateSectionEnrollmentLinkAction: (...a: unknown[]) => generate(...a),
    setSectionEnrollmentLinkActiveAction: (...a: unknown[]) => setActive(...a),
    rotateSectionEnrollmentLinkAction: (...a: unknown[]) => rotate(...a),
  }),
);

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

// jsdom does not implement HTMLDialogElement.showModal, which the real Modal calls in a
// layout effect. Render children when open and keep the assertions on the panel.
vi.mock("@/components/atoms/Modal", () => ({
  Modal: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

const labels = {
  title: "Invitar familias",
  lead: "Compartí este link",
  generate: "Crear link de inscripción",
  urlLabel: "Link de inscripción",
  copy: "Copiar",
  copied: "Link copiado",
  share: "Compartir",
  leadCount: "{count} familias se inscribieron por este link",
  leadCountNone: "Todavía ninguna familia usó este link",
  inactiveNotice: "Este link está desactivado.",
  activate: "Reactivar link",
  deactivate: "Desactivar link",
  rotate: "Generar un link nuevo",
  rotateConfirmTitle: "¿Generar un link nuevo?",
  rotateConfirmBody: "El link actual deja de funcionar.",
  rotateConfirm: "Generar link nuevo",
  cancel: "Cancelar",
  error: "No se pudo completar la acción.",
};

const SECTION = "11111111-1111-4111-8111-111111111111";
const TOKEN = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

async function renderPanel(
  state: { token: string | null; active: boolean; leadCount: number },
  canRevoke = true,
) {
  const { SectionEnrollmentLinkPanel } = await import(
    "@/components/molecules/SectionEnrollmentLinkPanel"
  );
  return render(
    <SectionEnrollmentLinkPanel
      locale="es"
      sectionId={SECTION}
      sectionName="Kids A1"
      state={state}
      labels={labels}
      canRevoke={canRevoke}
    />,
  );
}

describe("SectionEnrollmentLinkPanel", () => {
  beforeEach(() => {
    vi.resetModules();
    generate.mockReset();
    setActive.mockReset();
    rotate.mockReset();
    refresh.mockReset();
    generate.mockResolvedValue({ ok: true });
    setActive.mockResolvedValue({ ok: true });
    rotate.mockResolvedValue({ ok: true });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("offers only the generate button when no link exists", async () => {
    await renderPanel({ token: null, active: false, leadCount: 0 });
    expect(screen.getByRole("button", { name: labels.generate })).toBeInTheDocument();
    expect(screen.queryByLabelText(labels.urlLabel)).not.toBeInTheDocument();
  });

  it("generates the link and refreshes the screen", async () => {
    const user = userEvent.setup();
    await renderPanel({ token: null, active: false, leadCount: 0 });
    await user.click(screen.getByRole("button", { name: labels.generate }));
    expect(generate).toHaveBeenCalledWith("es", SECTION);
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the absolute url once a link exists", async () => {
    await renderPanel({ token: TOKEN, active: true, leadCount: 0 });
    const field = screen.getByLabelText(labels.urlLabel) as HTMLInputElement;
    expect(field.value).toContain(`/es/i/kids-a1/${TOKEN}`);
    expect(field).toHaveAttribute("readonly");
  });

  it("copies the url to the clipboard", async () => {
    const user = userEvent.setup();
    await renderPanel({ token: TOKEN, active: true, leadCount: 0 });
    const url = (screen.getByLabelText(labels.urlLabel) as HTMLInputElement).value;
    await user.click(screen.getByRole("button", { name: labels.copy }));
    expect(url).toContain(`/es/i/kids-a1/${TOKEN}`);
    expect(await screen.findByText(labels.copied)).toBeInTheDocument();
  });

  it("interpolates the lead count and handles zero separately", async () => {
    const { unmount } = await renderPanel({ token: TOKEN, active: true, leadCount: 4 });
    expect(
      screen.getByText("4 familias se inscribieron por este link"),
    ).toBeInTheDocument();
    unmount();

    await renderPanel({ token: TOKEN, active: true, leadCount: 0 });
    expect(screen.getByText(labels.leadCountNone)).toBeInTheDocument();
  });

  it("warns when the link is deactivated and offers reactivation", async () => {
    const user = userEvent.setup();
    await renderPanel({ token: TOKEN, active: false, leadCount: 0 });
    expect(screen.getByText(labels.inactiveNotice)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.activate }));
    expect(setActive).toHaveBeenCalledWith("es", SECTION, true);
  });

  it("asks for confirmation in a modal before rotating", async () => {
    const user = userEvent.setup();
    await renderPanel({ token: TOKEN, active: true, leadCount: 0 });
    await user.click(screen.getByRole("button", { name: labels.rotate }));
    expect(rotate).not.toHaveBeenCalled();
    expect(screen.getByText(labels.rotateConfirmBody)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.rotateConfirm }));
    expect(rotate).toHaveBeenCalledWith("es", SECTION);
  });

  it("hides deactivate and rotate when the caller may not revoke", async () => {
    await renderPanel({ token: TOKEN, active: true, leadCount: 0 }, false);
    expect(
      screen.queryByRole("button", { name: labels.deactivate }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.rotate })).not.toBeInTheDocument();
  });

  it("surfaces a failed action without pretending it worked", async () => {
    const user = userEvent.setup();
    generate.mockResolvedValue({ ok: false });
    await renderPanel({ token: null, active: false, leadCount: 0 });
    await user.click(screen.getByRole("button", { name: labels.generate }));
    expect(await screen.findByText(labels.error)).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});

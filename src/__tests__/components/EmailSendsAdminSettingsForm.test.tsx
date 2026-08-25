import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailSendsAdminSettingsForm } from "@/components/dashboard/EmailSendsAdminSettingsForm";
import type { Dictionary } from "@/types/i18n";

const setEmailSendEnabledAction = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/[locale]/dashboard/admin/settings/emailSendsSettingsActions", () => ({
  setEmailSendEnabledAction: (...a: unknown[]) => setEmailSendEnabledAction(...a),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const labels = {
  emailSendsTitle: "Envíos de email",
  emailSendsHint: "Activá o desactivá cada correo.",
  emailSendsTodayOn: "Hoy: se está enviando",
  emailSendsTodayOff: "Hoy: no se envía",
  emailSendsGroupAutomated: "Automáticos",
  emailSendsGroupBilling: "Facturación",
  emailSendsGroupAcademics: "Académico",
  emailSendsGroupMessaging: "Mensajería",
  emailSendsGroupOther: "Otros avisos",
  emailSendsLabelInactivity: "Recordatorios de no ingreso",
  emailSendsLabelClassReminder: "Recordatorios de clase",
  saved: "Guardado",
  error: "No se pudo guardar",
} as Dictionary["admin"]["settings"];

describe("EmailSendsAdminSettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setEmailSendEnabledAction.mockResolvedValue({ ok: true });
  });

  it("shows today’s on/off value and saves a toggle", async () => {
    const user = userEvent.setup();
    render(
      <EmailSendsAdminSettingsForm
        locale="es"
        labels={labels}
        groups={[
          {
            id: "automated",
            rows: [
              {
                templateKey: "churn.inactivity",
                enabled: true,
                label: "Recordatorios de no ingreso",
              },
              {
                templateKey: "notifications.class_reminder_prep",
                enabled: false,
                label: "Recordatorios de clase",
              },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByText("Hoy: se está enviando")).toBeInTheDocument();
    expect(screen.getByText("Hoy: no se envía")).toBeInTheDocument();
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes[0]).toBeChecked();
    expect(boxes[1]).not.toBeChecked();
    await user.click(boxes[0]!);
    expect(setEmailSendEnabledAction).toHaveBeenCalledWith({
      locale: "es",
      templateKey: "churn.inactivity",
      enabled: false,
    });
  });
});

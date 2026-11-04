import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailSendsAdminSettingsForm } from "@/components/dashboard/EmailSendsAdminSettingsForm";
import type { Dictionary } from "@/types/i18n";

const setEmailSendEnabledAction = vi.fn();
const setEmailMonthlyCapAction = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/[locale]/dashboard/admin/settings/emailSendsSettingsActions", () => ({
  setEmailSendEnabledAction: (...a: unknown[]) => setEmailSendEnabledAction(...a),
  setEmailMonthlyCapAction: (...a: unknown[]) => setEmailMonthlyCapAction(...a),
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
  emailMonthlyCapLabel: "Tope mensual de correos",
  emailMonthlyCapHint: "Cada cuenta puede enviar hasta este número.",
  emailMonthlyCapSave: "Guardar tope",
  emailMonthlyCapInvalid: "Escribe un número entero entre 1 y 100000.",
} as Dictionary["admin"]["settings"];

describe("EmailSendsAdminSettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setEmailSendEnabledAction.mockResolvedValue({ ok: true });
    setEmailMonthlyCapAction.mockResolvedValue({ ok: true });
  });

  it("shows today’s on/off value and saves a toggle", async () => {
    const user = userEvent.setup();
    render(
      <EmailSendsAdminSettingsForm
        locale="es"
        monthlyCap={5000}
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

  it("saves the monthly cap and refreshes", async () => {
    const user = userEvent.setup();
    render(
      <EmailSendsAdminSettingsForm
        locale="es"
        monthlyCap={5000}
        labels={labels}
        groups={[]}
      />,
    );
    await user.clear(screen.getByRole("spinbutton"));
    await user.type(screen.getByRole("spinbutton"), "4000");
    await user.click(screen.getByRole("button", { name: "Guardar tope" }));
    expect(setEmailMonthlyCapAction).toHaveBeenCalledWith({ locale: "es", cap: 4000 });
    expect(refresh).toHaveBeenCalled();
  });
});

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
  emailMonthlyCapLabel: "Tope mensual de correos",
  emailMonthlyCapHint: "Resend informa este número. Aquí solo lo ves.",
  emailMonthlyCapPulsarHint: "Este instituto envía por la cuenta de Pulsar hasta este número.",
  emailMonthlyCapLine: "{used} / {limit}",
  emailMonthlyCapUnread: "La clave de Resend no informa el tope.",
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
        mailMonth={{ source: "resend", used: 80, limit: 3000 }}
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

  it("shows the monthly cap as text", () => {
    render(
      <EmailSendsAdminSettingsForm
        locale="en"
        mailMonth={{ source: "resend", used: 80, limit: 3000 }}
        labels={labels}
        groups={[]}
      />,
    );
    const used = new Intl.NumberFormat("en").format(80);
    const limit = new Intl.NumberFormat("en").format(3000);
    expect(screen.getByText(`${used} / ${limit}`)).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar tope" })).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
import {
  EventEmailTemplateEditor,
  type EventEmailTemplateLabels,
} from "@/components/dashboard/admin/events/EventEmailTemplateEditor";
import {
  EVENT_EMAIL_TEMPLATE_KEYS,
  type EventEmailLocale,
  type EventEmailTemplateKey,
} from "@/lib/events/eventEmailCopy";

vi.mock("@/components/molecules/EmailTemplateBodyField", () => ({
  EmailTemplateBodyField: ({ bodyHtml }: { bodyHtml: string }) => <div>{bodyHtml}</div>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/eventEmailTemplateActions", () => ({
  saveEventEmailTemplateAction: vi.fn(async () => ({ ok: true })),
}));

import { saveEventEmailTemplateAction } from "@/app/[locale]/dashboard/admin/events/eventEmailTemplateActions";

const labels: EventEmailTemplateLabels = {
  mailLabel: "Email",
  mails: {
    registered: "Registration received",
    paymentApproved: "Payment approved",
    paymentRejected: "Payment rejected",
    reminder: "Reminder",
  },
  localeLabel: "Language",
  scopeLabel: "Who receives this version",
  scopeEvent: "Everyone at the event",
  subjectLabel: "Subject",
  bodyLabel: "Message",
  bodyHelp: "Help",
  save: "Save email",
  saved: "Email saved.",
  errorSave: "Save failed",
  errorValidation: "Write a message",
  previewTitle: "Preview",
  variablesLabel: "Insert a variable",
  variables: {
    firstName: "First name",
    lastName: "Last name",
    eventName: "Event name",
    flowName: "Flow name",
    eventDate: "Event date",
    eventLocation: "Location",
  },
  previewSamples: {
    firstName: "Ana",
    lastName: "Perez",
    eventName: "Open house",
    flowName: "Academy",
    eventDate: "March 12",
    eventLocation: "Hall",
  },
};

const fallbacks = Object.fromEntries(
  EVENT_EMAIL_TEMPLATE_KEYS.map((key) => [
    key,
    {
      es: { subject: "Asunto", bodyHtml: "<p>Hola</p>" },
      en: { subject: "Subject", bodyHtml: "<p>Hello</p>" },
      pt: { subject: "Assunto", bodyHtml: "<p>Olá</p>" },
    },
  ]),
) as Record<EventEmailTemplateKey, Record<EventEmailLocale, { subject: string; bodyHtml: string }>>;

describe("EventEmailTemplateEditor", () => {
  it("shows a flow version for confirmation mail and hides it for the reminder", () => {
    render(
      <EventEmailTemplateEditor
        eventId="11111111-1111-4111-8111-111111111111"
        pageLocale="es"
        flows={[{ id: "flow-1", name: "Academy" }]}
        copies={[]}
        fallbacks={fallbacks}
        bodyField={{} as never}
        labels={labels}
      />,
    );

    expect(screen.getByLabelText("Who receives this version")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "events.reminder" } });
    expect(screen.queryByLabelText("Who receives this version")).not.toBeInTheDocument();
  });

  it("inserts a variable into the message", () => {
    render(
      <EventEmailTemplateEditor
        eventId="11111111-1111-4111-8111-111111111111"
        pageLocale="es"
        flows={[]}
        copies={[]}
        fallbacks={fallbacks}
        bodyField={{} as never}
        labels={labels}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "First name" }));
    expect(screen.getByText(/\{\{firstName\}\}/)).toBeInTheDocument();
  });

  it("refreshes the page after the email is saved", async () => {
    refresh.mockClear();
    render(
      <EventEmailTemplateEditor
        eventId="11111111-1111-4111-8111-111111111111"
        pageLocale="es"
        flows={[]}
        copies={[]}
        fallbacks={fallbacks}
        bodyField={{} as never}
        labels={labels}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save email" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Email saved.");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows a validation or save error and starts in the page language", async () => {
    vi.mocked(saveEventEmailTemplateAction).mockResolvedValueOnce({
      ok: false,
      message: "validation_failed",
    });
    const { unmount } = render(
      <EventEmailTemplateEditor
        eventId="11111111-1111-4111-8111-111111111111"
        pageLocale="pt"
        flows={[]}
        copies={[]}
        fallbacks={fallbacks}
        bodyField={{} as never}
        labels={labels}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Language" })).toHaveValue("pt");
    expect(screen.getByDisplayValue("Assunto")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save email" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Write a message");
    unmount();

    vi.mocked(saveEventEmailTemplateAction).mockResolvedValueOnce({
      ok: false,
      message: "save_failed",
    });
    render(
      <EventEmailTemplateEditor
        eventId="11111111-1111-4111-8111-111111111111"
        pageLocale="es"
        flows={[]}
        copies={[
          {
            templateKey: "events.registered",
            locale: "es",
            flowId: null,
            subject: "Copia",
            bodyHtml: "Hola",
          },
        ]}
        fallbacks={fallbacks}
        bodyField={{} as never}
        labels={labels}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "First name" }));
    expect(screen.getByText(/Hola\{\{firstName\}\}/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save email" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Save failed");
  });
});

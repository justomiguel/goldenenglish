import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import type {
  EmailTemplateDefinition,
  EmailTemplateOverrideRow,
} from "@/types/emailTemplates";
import type { Locale } from "@/types/i18n";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const { saveMock, resetMock } = vi.hoisted(() => ({
  saveMock: vi.fn(),
  resetMock: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/communications/templates/actions", () => ({
  saveEmailTemplateAction: saveMock,
  resetEmailTemplateAction: resetMock,
}));

import {
  EmailTemplatesShell,
  type EmailTemplatesShellEntry,
} from "@/components/dashboard/admin/communications/EmailTemplatesShell";

const labels = dictEn.admin.communications.templates;

const definition: EmailTemplateDefinition = {
  key: "messaging.teacher_new",
  category: "messaging",
  label: { es: "Mensajería ES", en: "Messaging EN" },
  description: { es: "Descripción ES", en: "Description EN" },
  placeholders: [
    { name: "senderName", description: "Quien envía", sample: "Ann" },
    { name: "messagePreview", description: "Resumen", sample: "Hi" },
    { name: "href", description: "URL", sample: "https://x" },
  ],
  defaults: {
    es: { subject: "Asunto ES {{senderName}}", bodyHtml: "<p>Body ES {{senderName}}</p>" },
    en: { subject: "Subject EN", bodyHtml: "<p>Body EN</p>" },
  },
};

function makeEntry(
  overrides: Partial<Record<Locale, EmailTemplateOverrideRow | null>> = {},
): EmailTemplatesShellEntry {
  return {
    definition,
    overridesByLocale: {
      es: overrides.es ?? null,
      en: overrides.en ?? null,
    },
  };
}

const brand = {
  name: "Test Inst",
  legalName: "Test Inst LLC",
  logoPath: "/images/logo.png",
  logoAlt: "Logo",
  contactEmail: "hi@test.example",
  contactAddress: "Av. Siempre Viva",
};

function renderShell(entries: EmailTemplatesShellEntry[] = [makeEntry()]) {
  return render(
    <EmailTemplatesShell
      locale="es"
      labels={labels}
      entries={entries}
      brand={brand}
      origin="https://app.test.example"
    />,
  );
}

describe("EmailTemplatesShell", () => {
  beforeEach(() => {
    saveMock.mockReset();
    resetMock.mockReset();
  });

  it("renders the empty catalog message when there are no entries", () => {
    render(
      <EmailTemplatesShell
        locale="es"
        labels={labels}
        entries={[]}
        brand={brand}
        origin="https://app.test.example"
      />,
    );
    expect(screen.getByText(labels.emptyCatalog)).toBeInTheDocument();
  });

  it("renders the editor with default subject and body for the first entry", () => {
    renderShell();
    const subjectInput = screen.getByLabelText(labels.subjectLabel) as HTMLInputElement;
    expect(subjectInput.value).toBe("Asunto ES {{senderName}}");
    const bodyArea = screen.getByLabelText(labels.bodyLabel) as HTMLTextAreaElement;
    expect(bodyArea.value).toBe("<p>Body ES {{senderName}}</p>");
  });

  it("disables save when the draft equals the current default (not dirty)", () => {
    renderShell();
    const saveBtn = screen.getByRole("button", { name: labels.saveCta });
    expect(saveBtn).toBeDisabled();
  });

  it("enables save and dispatches the save action with the current draft", async () => {
    saveMock.mockResolvedValue({ ok: true, updatedAt: "2026-04-17T00:00:00Z" });
    renderShell();
    const subjectInput = screen.getByLabelText(labels.subjectLabel);
    fireEvent.change(subjectInput, { target: { value: "Nuevo asunto" } });

    const saveBtn = screen.getByRole("button", { name: labels.saveCta });
    expect(saveBtn).toBeEnabled();
    fireEvent.click(saveBtn);

    await vi.waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: "es",
          templateKey: "messaging.teacher_new",
          templateLocale: "es",
          subject: "Nuevo asunto",
        }),
      );
    });
  });

  it("displays the localized error message when the save action fails", async () => {
    saveMock.mockResolvedValue({ ok: false, code: "persist_failed" });
    renderShell();
    fireEvent.change(screen.getByLabelText(labels.subjectLabel), {
      target: { value: "Otro asunto" },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.saveCta }));

    await vi.waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(labels.errors.persist_failed);
    });
  });

  it("flags entries with an existing override using the editedSuffix in the dropdown", () => {
    const entry = makeEntry({
      es: {
        templateKey: "messaging.teacher_new",
        locale: "es",
        subject: "Custom",
        bodyHtml: "<p>Custom</p>",
        updatedAt: "2026-04-17T00:00:00Z",
        updatedBy: null,
      },
    });
    renderShell([entry]);
    const select = screen.getByLabelText(labels.selectLabel) as HTMLSelectElement;
    const labelEs = Array.from(select.options).find((o) => o.value.endsWith("::es"));
    expect(labelEs?.textContent).toContain(labels.editedSuffix);
  });
});

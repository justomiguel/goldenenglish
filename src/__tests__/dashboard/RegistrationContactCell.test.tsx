import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { dictEn } from "@/test/dictEn";
import { RegistrationContactCell } from "@/components/dashboard/RegistrationContactCell";

const labels = dictEn.admin.registrations;

function renderCell(
  entry: { label: string | null; phoneDisplay: string; whatsAppDigits: string | null } | null,
) {
  return render(
    <RegistrationContactCell
      entry={entry}
      contactName="Ana"
      instituteName="Mi Mundo"
      labels={labels}
    />,
  );
}

describe("RegistrationContactCell", () => {
  it("links to WhatsApp with the prefilled greeting when the number resolves", () => {
    renderCell({
      label: null,
      phoneDisplay: "+54 9 362 470-8145",
      whatsAppDigits: "5493624708145",
    });

    const expectedText = labels.whatsAppMessage
      .replaceAll("{name}", "Ana")
      .replaceAll("{institute}", "Mi Mundo");
    expect(screen.getByRole("link", { name: labels.contactWhatsApp })).toHaveAttribute(
      "href",
      `https://wa.me/5493624708145?text=${encodeURIComponent(expectedText)}`,
    );
  });

  it("shows the number but no WhatsApp link when it cannot be resolved", () => {
    renderCell({ label: null, phoneDisplay: "123", whatsAppDigits: null });

    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: labels.contactWhatsApp })).not.toBeInTheDocument();
    expect(screen.getByText(labels.contactWhatsAppUnavailable)).toBeInTheDocument();
  });

  it("renders the guardian name when the entry carries one", () => {
    renderCell({
      label: "Marta Perez",
      phoneDisplay: "+54 9 362 470-8145",
      whatsAppDigits: "5493624708145",
    });

    expect(screen.getByText("Marta Perez")).toBeInTheDocument();
  });

  it("renders the empty marker when there is no phone", () => {
    renderCell(null);

    expect(screen.getByText(labels.emptyValue)).toBeInTheDocument();
  });

  it("copies the number as typed, not the normalized digits", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderCell({
      label: null,
      phoneDisplay: "+54 9 362 470-8145",
      whatsAppDigits: "5493624708145",
    });
    await userEvent.click(screen.getByRole("button", { name: labels.contactCopy }));

    expect(writeText).toHaveBeenCalledWith("+54 9 362 470-8145");
  });
});

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AdminEventDiscountCodesPanel } from "@/components/dashboard/admin/events/AdminEventDiscountCodesPanel";
import type { AdminEventDiscountCodeLabels } from "@/components/dashboard/admin/events/adminEventDiscountCodeLabels";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/es/dashboard/admin/events/event-1",
}));
vi.mock("@/app/[locale]/dashboard/admin/events/eventDiscountCodeActions", () => ({
  deleteEventDiscountCodeAction: vi.fn(),
  exportEventDiscountCodesAction: vi.fn(),
  generateEventDiscountCodesAction: vi.fn(),
  importEventDiscountCodesAction: vi.fn(),
  saveEventDiscountCodeAction: vi.fn(),
}));

const labels = {
  lead: "Lead",
  code: "Code",
  uses: "Uses",
  usesHint: "Hint",
  percent: "Percent",
  modeLegend: "Discount type",
  modePercent: "Percent",
  modeAmount: "Fixed amount",
  amount: "Amount",
  tickets: "Tickets covered",
  amountHint: "Amount comes off each covered ticket.",
  amountCell: "{{amount}} off {{count}} tickets",
  add: "Add",
  importFile: "Import",
  exportFile: "Export",
  generate: "Generate",
  quantity: "Quantity",
  download: "Download",
  delete: "Delete",
  confirmTitle: "Delete?",
  confirmBody: "Body",
  cancel: "Cancel",
  unlimited: "No cap",
  empty: "Empty",
  saved: "Saved",
  error: "Error",
  showUses: "Show who used it",
  hideUses: "Hide uses",
  noUsesYet: "Nobody",
  usesCap: "Cap",
  useStatus: { reserved: "Reserved", consumed: "Confirmed", released: "Released" },
  paymentStatus: { pending: "Payment pending", approved: "Approved", rejected: "Rejected", none: "No payment" },
  columns: {
    code: "Code",
    uses: "Uses",
    percent: "Percent",
    reserved: "Reserved",
    consumed: "Confirmed",
    person: "Person",
    email: "Email",
    use: "Use",
    payment: "Payment",
  },
  errors: {
    duplicate: "d",
    empty_code: "e",
    bad_percent: "p",
    bad_uses: "u",
    cap_below_occupied: "c",
    empty_file: "f",
    quantity: "q",
    occupied: "o",
    forbidden: "x",
    file: "file",
    bad_amount: "bad amount",
    bad_tickets: "bad tickets",
    wrong_file: "wrong file",
    examples_only: "examples",
  },
} satisfies AdminEventDiscountCodeLabels;

describe("AdminEventDiscountCodesPanel", () => {
  it("shows the name, email, and payment status for each use", () => {
    render(
      <AdminEventDiscountCodesPanel
        locale="es"
        eventId="event-1"
        currency="CLP"
        labels={labels}
        rows={[
          {
            id: "code-1",
            code: "SAVE10",
            kind: "percent",
            discountPercent: 10,
            discountAmount: null,
            ticketCount: null,
            maxUses: 2,
            reserved: 1,
            consumed: 0,
            uses: [
              {
                id: "use-1",
                codeId: "code-1",
                attendeeName: "Pérez Ana",
                email: "ana@example.com",
                useStatus: "reserved",
                paymentStatus: "pending",
              },
              {
                id: "use-2",
                codeId: "code-1",
                attendeeName: "Gómez Luis",
                email: "luis@example.com",
                useStatus: "released",
                paymentStatus: null,
              },
            ],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show who used it" }));
    expect(screen.getByText("Pérez Ana")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText("Payment pending")).toBeInTheDocument();
    expect(screen.getByText("Gómez Luis")).toBeInTheDocument();
    expect(screen.getByText("No payment")).toBeInTheDocument();
    expect(screen.getByText("Released")).toBeInTheDocument();
    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(screen.getByRole("table")).toHaveClass("ge-stack-cards");
  });

  it("shows the amount and ticket fields only in fixed-amount mode", () => {
    render(
      <AdminEventDiscountCodesPanel
        locale="es"
        eventId="event-1"
        currency="CLP"
        labels={labels}
        rows={[]}
      />,
    );
    expect(screen.getByRole("textbox", { name: "Percent" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Amount" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Fixed amount" }));
    expect(screen.queryByRole("textbox", { name: "Percent" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Amount" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Tickets covered" })).toBeInTheDocument();
    expect(screen.getByText("Amount comes off each covered ticket.")).toBeInTheDocument();
  });
});

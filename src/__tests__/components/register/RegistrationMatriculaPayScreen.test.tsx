import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RegistrationMatriculaPayScreen } from "@/components/register/RegistrationMatriculaPayScreen";
import type { RegistrationPayContext } from "@/lib/register/parseRegistrationPayContext";

vi.mock("@/app/[locale]/matricula/matriculaPayActions", () => ({
  startRegistrationEnrollmentFlowAction: vi.fn(),
  startRegistrationEnrollmentMercadoPagoAction: vi.fn(),
  uploadRegistrationEnrollmentReceiptAction: vi.fn(),
  switchRegistrationPaySectionAction: vi.fn(),
}));

const labels = {
  title: "Recibimos tu preinscripción",
  lead: "los cupos se pueden acabar",
  full: "Ese horario se llenó",
  alreadyIn: "Ya estás inscrito",
  amount: "Matrícula",
  enrollmentKind: "Matrícula",
  noFee: "te va a confirmar",
  needsSection: "asignamos horario",
  receiptPending: "estamos revisando el comprobante",
  captured: "ya recibimos el pago",
  capturedFull: "pago recibido, horario lleno",
  noMethods: "escríbenos",
  contact: "Contacto",
  whatsapp: "WhatsApp",
  noAlternatives: "no hay otro horario",
};

const base: RegistrationPayContext = {
  firstName: "Ana",
  lastName: "Pérez",
  status: "new",
  intakeState: "awaiting_fee",
  feeCaptured: false,
  snapshotTotal: 80,
  snapshotCurrency: "CLP",
  preferredSectionId: "sec-1",
  proposedSectionId: null,
  additionalSectionIds: [],
};

describe("RegistrationMatriculaPayScreen", () => {
  it("shows the received copy and snapshot amount", () => {
    render(
      <RegistrationMatriculaPayScreen
        locale="es"
        studentName="Ana Pérez"
        sectionLabel="A2 Mañana"
        context={base}
        sectionIsFull={false}
        labels={labels}
      />,
    );
    expect(screen.getByRole("heading", { name: labels.title })).toBeInTheDocument();
    expect(screen.getByText(/cupos se pueden acabar/)).toBeInTheDocument();
    expect(screen.getByText(/Matrícula/)).toBeInTheDocument();
  });

  it("shows the full-section error when the seat is gone", () => {
    render(
      <RegistrationMatriculaPayScreen
        locale="es"
        studentName="Ana Pérez"
        sectionLabel="A2 Mañana"
        context={base}
        sectionIsFull={true}
        labels={labels}
      />,
    );
    expect(screen.getByText(labels.full)).toBeInTheDocument();
  });

  it("shows the receipt-pending copy instead of the pay lead", () => {
    render(
      <RegistrationMatriculaPayScreen
        locale="es"
        studentName="Ana Pérez"
        sectionLabel="A2 Mañana"
        context={{ ...base, intakeState: "receipt_pending" }}
        sectionIsFull={false}
        labels={labels}
      />,
    );
    expect(screen.getByText(labels.receiptPending)).toBeInTheDocument();
    expect(screen.queryByText(/cupos se pueden acabar/)).not.toBeInTheDocument();
  });

  it("shows transfer instructions when transfer is the only method", () => {
    render(
      <RegistrationMatriculaPayScreen
        locale="es"
        studentName="Ana Pérez"
        sectionLabel="A2 Mañana"
        context={base}
        sectionIsFull={false}
        labels={labels}
        payUi={{
          token: "tok",
          methods: ["transfer"],
          transferInstructions: "Banco Estado 123",
          alternatives: [],
          whatsappUrl: "",
          contactEmail: "",
          actionLabels: {
            flow: "Flow",
            mercadoPago: "MP",
            transfer: "Transferencia bancaria",
            transferHint: "Sube el comprobante",
            uploadButton: "Enviar comprobante",
            pickSection: "Elegí",
            error: "Error",
            receiptOk: "Ok",
          },
        }}
      />,
    );
    expect(screen.getByText("Banco Estado 123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar comprobante" })).toBeInTheDocument();
  });

  it("shows the offer and hides pay methods until they accept", () => {
    render(
      <RegistrationMatriculaPayScreen
        locale="es"
        studentName="Ana Pérez"
        sectionLabel="A2 Mañana"
        proposedSectionLabel="B1 Tarde"
        context={{
          ...base,
          intakeState: "offer_pending",
          preferredSectionId: "sec-1",
          proposedSectionId: "sec-2",
        }}
        sectionIsFull={true}
        labels={{
          ...labels,
          offerLead: "El horario de {{original}} se llenó. Te proponemos {{proposed}}.",
          offerAccept: "Aceptar este horario",
          offerGone: "esa propuesta también se llenó",
        }}
        payUi={{
          token: "tok",
          methods: ["flow"],
          transferInstructions: null,
          alternatives: [{ id: "sec-3", label: "C1 Noche" }],
          whatsappUrl: "",
          contactEmail: "",
          actionLabels: {
            flow: "Flow",
            mercadoPago: "MP",
            transfer: "T",
            transferHint: "",
            uploadButton: "Enviar",
            pickSection: "Elegí",
            error: "Error",
            receiptOk: "Ok",
            acceptOffer: "Aceptar este horario",
          },
        }}
      />,
    );
    expect(screen.getByText(/Te proponemos B1 Tarde/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aceptar este horario" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Flow" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "C1 Noche" })).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventRegisterOrderedQuestions } from "@/components/organisms/EventRegisterOrderedQuestions";

const values = {
  firstName: "",
  lastName: "",
  dni: "",
  email: "",
  phone: "",
  birthDate: "",
};

const onChange = {
  firstName: vi.fn(),
  lastName: vi.fn(),
  dni: vi.fn(),
  email: vi.fn(),
  phone: vi.fn(),
  birthDate: vi.fn(),
};

describe("EventRegisterOrderedQuestions", () => {
  it("renders base fields and extras in the saved order and marks phone required", () => {
    render(
      <EventRegisterOrderedQuestions
        sectionTitle="Datos"
        questionOrder={["base:firstName", "field:school", "base:phone"]}
        collectBirthDate
        requirePhone
        requireBirthDate={false}
        fields={[
          {
            id: "school",
            fieldKey: "school",
            fieldType: "text",
            labelI18n: { es: "Colegio" },
            required: false,
          },
        ]}
        locale="es"
        defaultLocale="es"
        labels={{
          firstName: "Nombre",
          lastName: "Apellido",
          dni: "Documento",
          email: "Correo",
          phone: "Teléfono",
          birthDate: "Nacimiento",
        }}
        values={values}
        onChange={onChange}
        customValues={{}}
        fieldFiles={{}}
        onCustomChange={vi.fn()}
        onFileChange={vi.fn()}
        onFileValidationError={vi.fn()}
        fileFieldErrors={{}}
        selectPlaceholder="Elegí"
        customFileFieldLabels={{
          fileButton: "Archivo",
          imageButton: "Imagen",
          noFile: "Sin archivo",
          required: "Obligatorio",
          tooLarge: "Grande",
          invalidType: "Tipo",
          fileInputAriaLabel: "Archivo",
          imageInputAriaLabel: "Imagen",
        }}
      />,
    );

    const firstName = screen.getByLabelText("Nombre");
    const school = screen.getByLabelText("Colegio");
    const phone = screen.getByLabelText("Teléfono");
    expect(firstName.compareDocumentPosition(school) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(school.compareDocumentPosition(phone) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(phone).toBeRequired();
    expect(screen.queryByLabelText("Nacimiento")).not.toBeInTheDocument();
  });
});

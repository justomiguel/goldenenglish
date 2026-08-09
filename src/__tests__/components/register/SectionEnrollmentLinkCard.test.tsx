import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionEnrollmentLinkCard } from "@/components/register/SectionEnrollmentLinkCard";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";

const labels = {
  heading: "Te estás inscribiendo en",
  scheduleLabel: "Horario",
  scheduleEmpty: "Horario a confirmar",
  weekdays: {
    sun: "Dom",
    mon: "Lun",
    tue: "Mar",
    wed: "Mié",
    thu: "Jue",
    fri: "Vie",
    sat: "Sáb",
  },
  seatsRemainingOne: "Queda 1 cupo",
  seatsRemainingMany: "Quedan {count} cupos",
  waitingListNotice: "Este grupo está completo.",
  unavailableTitle: "no disponible",
  unavailableInvalid: "inválido",
  unavailableClosed: "cerrado",
  backHome: "Ir al inicio",
};

function makeLink(
  overrides: Partial<SectionEnrollmentLinkContext> = {},
): SectionEnrollmentLinkContext {
  return {
    token: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
    sectionId: "11111111-1111-1111-1111-111111111111",
    sectionName: "Sección B",
    cohortName: "Ciclo 2026",
    scheduleSlots: [{ dayOfWeek: 1, startTime: "18:00", endTime: "19:30" }],
    seatsRemaining: 3,
    ...overrides,
  };
}

describe("SectionEnrollmentLinkCard", () => {
  it("names the cohort and the section", () => {
    render(<SectionEnrollmentLinkCard link={makeLink()} labels={labels} />);
    expect(
      screen.getByRole("group", { name: labels.heading }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sección B" })).toBeInTheDocument();
    expect(screen.getByText("Ciclo 2026")).toBeInTheDocument();
  });

  it("omits the cohort line when the section has no cohort", () => {
    const { container } = render(
      <SectionEnrollmentLinkCard link={makeLink({ cohortName: "" })} labels={labels} />,
    );
    expect(screen.queryByText("Ciclo 2026")).not.toBeInTheDocument();
    // loadSectionEnrollmentLink turns a null cohort into "", which would otherwise
    // reach the DOM as a blank paragraph under the section name.
    expect(container.querySelector("p:empty")).toBeNull();
  });

  it("renders each slot with its weekday label and time range", () => {
    render(
      <SectionEnrollmentLinkCard
        link={makeLink({
          scheduleSlots: [
            { dayOfWeek: 1, startTime: "18:00", endTime: "19:30" },
            { dayOfWeek: 3, startTime: "09:00", endTime: "10:00" },
          ],
        })}
        labels={labels}
      />,
    );
    expect(screen.getByText("Lun 18:00–19:30")).toBeInTheDocument();
    expect(screen.getByText("Mié 09:00–10:00")).toBeInTheDocument();
  });

  it("falls back to the empty-schedule label when there are no slots", () => {
    render(
      <SectionEnrollmentLinkCard
        link={makeLink({ scheduleSlots: [] })}
        labels={labels}
      />,
    );
    expect(screen.getByText(labels.scheduleEmpty)).toBeInTheDocument();
  });

  it("interpolates the remaining seats", () => {
    render(<SectionEnrollmentLinkCard link={makeLink({ seatsRemaining: 3 })} labels={labels} />);
    expect(screen.getByText("Quedan 3 cupos")).toBeInTheDocument();
    expect(screen.queryByText(labels.waitingListNotice)).not.toBeInTheDocument();
  });

  it("uses the singular copy for the last seat", () => {
    render(<SectionEnrollmentLinkCard link={makeLink({ seatsRemaining: 1 })} labels={labels} />);
    expect(screen.getByText("Queda 1 cupo")).toBeInTheDocument();
  });

  it("says nothing about seats when the section has no limit", () => {
    render(
      <SectionEnrollmentLinkCard
        link={makeLink({ seatsRemaining: null })}
        labels={labels}
      />,
    );
    expect(screen.queryByText(/cupo/)).not.toBeInTheDocument();
    expect(screen.queryByText(labels.waitingListNotice)).not.toBeInTheDocument();
  });

  it("warns about the waiting list when the section is full", () => {
    render(
      <SectionEnrollmentLinkCard link={makeLink({ seatsRemaining: 0 })} labels={labels} />,
    );
    expect(screen.getByText(labels.waitingListNotice)).toBeInTheDocument();
    expect(screen.queryByText(/Quedan/)).not.toBeInTheDocument();
  });
});

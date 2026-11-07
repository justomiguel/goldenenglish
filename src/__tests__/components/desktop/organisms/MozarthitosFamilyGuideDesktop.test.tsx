// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import es from "@/dictionaries/es.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/es/encuentra-tu-clase",
}));

import { MozarthitosFamilyGuideDesktop } from "@/components/desktop/organisms/MozarthitosFamilyGuideDesktop";
import { useMozarthitosFamilyGuide } from "@/hooks/useMozarthitosFamilyGuide";

const labels = es.landing.mz.guide;

function Harness() {
  const guide = useMozarthitosFamilyGuide({
    locale: "es",
    labels,
    place: "Sede Las Condes · República Árabe de Egipto 670",
    initial: { ageBand: null, attendance: null },
  });
  return <MozarthitosFamilyGuideDesktop guide={guide} labels={labels} />;
}

describe("MozarthitosFamilyGuideDesktop", () => {
  it("asks both questions and shows the in-person trial CTA with the sede", () => {
    render(<Harness />);
    expect(screen.getByRole("heading", { name: labels.ageQuestion })).toBeTruthy();
    expect(screen.getByText("Paso 1 de 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: labels.age["3y_4y"] }));
    expect(screen.getByRole("heading", { name: labels.attendanceQuestion })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: labels.attendance.in_person }));

    expect(screen.getByRole("heading", { name: labels.stage.little_musicians.title })).toBeTruthy();
    expect(screen.getByText("Sede Las Condes · República Árabe de Egipto 670")).toBeTruthy();
    const cta = screen.getByRole("link", { name: labels.offer.in_person.cta });
    expect(cta.getAttribute("href")).toBe(
      "/es/register?intent=trial&guide=little_musicians.in_person.3y_4y",
    );
    expect(screen.getByRole("link", { name: labels.choirLink })).toBeTruthy();
  });

  it("shows the waitlist for babies under 6 months", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: labels.age.under_6m }));
    fireEvent.click(screen.getByRole("button", { name: labels.attendance.unsure }));
    expect(screen.getByRole("heading", { name: labels.waitlist.title })).toBeTruthy();
    expect(screen.getByRole("link", { name: labels.waitlist.cta }).getAttribute("href")).toBe(
      "/es/register?intent=reserve&guide=baby_mago.in_person.under_6m",
    );
  });

  it("goes back from the attendance question to the age question", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: labels.age["8y_plus"] }));
    fireEvent.click(screen.getByRole("button", { name: labels.back }));
    expect(screen.getByRole("heading", { name: labels.ageQuestion })).toBeTruthy();
  });
});

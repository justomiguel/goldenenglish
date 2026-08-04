import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingLioraHorariosSection } from "@/components/organisms/LandingLioraHorariosSection";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LIORA_SATURDAY_SCHEDULE } from "@/lib/landing/lioraSchedule";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

const dict = dictEs as Dictionary;
const t = (path: string) => marketingLandingCopy(dict, "liora", path);

describe("LandingLioraHorariosSection", () => {
  it("renders one heading per sede with its translated name", () => {
    render(<LandingLioraHorariosSection t={t} />);

    for (const sede of LIORA_SATURDAY_SCHEDULE) {
      expect(
        screen.getByRole("heading", { name: t(`sedes.${sede.sedeKey}.name`) }),
      ).toBeInTheDocument();
    }
  });

  it("lists every slot with its time, class title and age range", () => {
    render(<LandingLioraHorariosSection t={t} />);

    for (const sede of LIORA_SATURDAY_SCHEDULE) {
      const heading = screen.getByRole("heading", {
        name: t(`sedes.${sede.sedeKey}.name`),
      });
      const block = heading.parentElement as HTMLElement;

      for (const slot of sede.slots) {
        expect(within(block).getByText(slot.time)).toBeInTheDocument();
        expect(
          within(block).getByText(t(`clases.${slot.classKey}.title`)),
        ).toBeInTheDocument();
        expect(
          within(block).getByText(
            t("clases.ageLabel").replace("{ages}", slot.ages),
          ),
        ).toBeInTheDocument();
      }
    }
  });

  it("labels the section as the Saturday timetable", () => {
    render(<LandingLioraHorariosSection t={t} />);

    expect(
      screen.getByRole("heading", { name: t("horarios.sectionTitle") }),
    ).toBeInTheDocument();
    expect(screen.getByText(t("horarios.dayLabel"))).toBeInTheDocument();
  });
});

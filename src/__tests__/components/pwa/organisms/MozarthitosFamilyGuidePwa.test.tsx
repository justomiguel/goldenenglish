// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import es from "@/dictionaries/es.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/es/encuentra-tu-clase",
}));

import { MozarthitosFamilyGuidePwa } from "@/components/pwa/organisms/MozarthitosFamilyGuidePwa";
import {
  useMozarthitosFamilyGuide,
  type MzFamilyGuideAnswers,
} from "@/hooks/useMozarthitosFamilyGuide";

const labels = es.landing.mz.guide;

function Harness({ initial }: { initial: MzFamilyGuideAnswers }) {
  const guide = useMozarthitosFamilyGuide({ locale: "es", labels, place: "Sede", initial });
  return <MozarthitosFamilyGuidePwa guide={guide} labels={labels} />;
}

describe("MozarthitosFamilyGuidePwa", () => {
  it("shows one question per screen as tall rows", () => {
    render(<Harness initial={{ ageBand: null, attendance: null }} />);
    const row = screen.getByRole("button", { name: labels.age["6m_2y"] });
    expect(row.className).toContain("min-h-[56px]");
    expect(screen.queryByRole("heading", { name: labels.attendanceQuestion })).toBeNull();
  });

  it("lists remote offers and puts the first one in the sticky bottom CTA", () => {
    render(<Harness initial={{ ageBand: null, attendance: "remote" }} />);
    fireEvent.click(screen.getByRole("button", { name: labels.age["6m_2y"] }));
    expect(screen.getByRole("heading", { name: labels.stage.baby_mago.title })).toBeTruthy();
    const sticky = screen.getByRole("link", { name: labels.offer.live_online.cta });
    expect(sticky.getAttribute("href")).toBe(
      "/es/register?intent=trial&guide=baby_mago.live_online.6m_2y",
    );
    expect(sticky.parentElement?.className).toContain("sticky");
    expect(screen.getByRole("link", { name: new RegExp(labels.offer.pack.title) }).getAttribute("href")).toBe(
      "/es/register?intent=trial&guide=baby_mago.pack.6m_2y",
    );
  });

  it("offers contact for remote instrument families", () => {
    render(<Harness initial={{ ageBand: "8y_plus", attendance: "remote" }} />);
    expect(screen.getByRole("link", { name: new RegExp(labels.offer.contact.title) }).getAttribute("href")).toBe(
      "/es#contacto",
    );
  });
});

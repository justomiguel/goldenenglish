import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegisterSectionPicker } from "@/components/register/RegisterSectionPicker";
import { dictEn } from "@/test/dictEn";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

const options = [
  {
    id: A,
    label: "Yoga mañana",
    hasOpenSeat: true,
    offersTrial: true,
    slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }],
  },
  {
    id: B,
    label: "Yoga tarde",
    hasOpenSeat: false,
    offersTrial: true,
    slots: [{ dayOfWeek: 1, startTime: "18:00", endTime: "19:00" }],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    label: "Sin trial",
    hasOpenSeat: true,
    offersTrial: false,
    slots: [{ dayOfWeek: 2, startTime: "10:00", endTime: "11:00" }],
  },
];

describe("RegisterSectionPicker", () => {
  it("defaults to combo on a narrow viewport and omits full sections", () => {
    const onChange = vi.fn();
    render(
      <RegisterSectionPicker
        dict={dictEn.register}
        options={options}
        intent="reserve"
        selectedIds={[]}
        onChange={onChange}
        initialView="combo"
      />,
    );
    const combo = screen.getByLabelText(dictEn.register.level);
    expect(combo).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Yoga mañana" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Yoga tarde" })).not.toBeInTheDocument();
  });

  it("disables full calendar cells and hides non-trial sections", () => {
    render(
      <RegisterSectionPicker
        dict={dictEn.register}
        options={options}
        intent="trial"
        selectedIds={[]}
        onChange={vi.fn()}
        initialView="calendar"
      />,
    );
    expect(screen.getByRole("button", { name: /Yoga mañana 09:00/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Yoga tarde 18:00/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Sin trial/ })).not.toBeInTheDocument();
  });

  it("renders the week calendar as a framed timetable with hour marks and day columns", () => {
    render(
      <RegisterSectionPicker
        dict={dictEn.register}
        options={options}
        intent="reserve"
        selectedIds={[]}
        onChange={vi.fn()}
        initialView="calendar"
      />,
    );
    const gutter = screen.getByTestId("register-week-time-gutter");
    expect(gutter).toHaveTextContent("09:00");
    expect(gutter).toHaveTextContent("18:00");
    expect(screen.getByTestId("register-week-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("register-week-day-1")).toBeInTheDocument();
    expect(screen.getByTestId("register-week-day-0")).toBeInTheDocument();
  });

  it("toggles a calendar cell into the selected section ids", () => {
    const onChange = vi.fn();
    render(
      <RegisterSectionPicker
        dict={dictEn.register}
        options={options}
        intent="reserve"
        selectedIds={[]}
        onChange={onChange}
        initialView="calendar"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Yoga mañana 09:00/ }));
    expect(onChange).toHaveBeenCalledWith([A]);
  });
});

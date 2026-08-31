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
  it("defaults to the list combo instead of the week calendar", () => {
    render(
      <RegisterSectionPicker
        dict={dictEn.register}
        options={options}
        intent="reserve"
        selectedIds={[]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(dictEn.register.level)).toBeInTheDocument();
    expect(screen.queryByTestId("register-week-calendar")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: dictEn.register.picker.viewCombo })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

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

  it("keeps the week calendar inside a bounded scrollport so the form does not overflow", () => {
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
    const calendar = screen.getByTestId("register-week-calendar");
    expect(calendar).toHaveClass("min-w-0", "max-w-full", "overflow-auto");
    const fieldset = calendar.closest("fieldset");
    expect(fieldset).toHaveClass("min-w-0");
  });

  it("shows only the section name on calendar cells and a detail chip when selected", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RegisterSectionPicker
        dict={dictEn.register}
        options={[
          {
            id: A,
            label: "2026 — Ballet Básico Adulto",
            hasOpenSeat: true,
            offersTrial: true,
            slots: [{ dayOfWeek: 5, startTime: "19:00", endTime: "20:15" }],
          },
        ]}
        intent="reserve"
        selectedIds={[]}
        onChange={onChange}
        initialView="calendar"
      />,
    );
    const cell = screen.getByRole("button", { name: /Ballet Básico Adulto 19:00/ });
    expect(cell).toHaveTextContent("Ballet Básico Adulto");
    expect(cell).not.toHaveTextContent("2026");
    expect(cell).not.toHaveTextContent("19:00");
    expect(screen.queryByTestId("register-week-selected")).not.toBeInTheDocument();

    fireEvent.click(cell);
    expect(onChange).toHaveBeenCalledWith([A]);

    rerender(
      <RegisterSectionPicker
        dict={dictEn.register}
        options={[
          {
            id: A,
            label: "2026 — Ballet Básico Adulto",
            hasOpenSeat: true,
            offersTrial: true,
            slots: [{ dayOfWeek: 5, startTime: "19:00", endTime: "20:15" }],
          },
        ]}
        intent="reserve"
        selectedIds={[A]}
        onChange={onChange}
        initialView="calendar"
      />,
    );
    const chipList = screen.getByTestId("register-week-selected");
    expect(chipList).toHaveTextContent("Ballet Básico Adulto");
    expect(chipList).toHaveTextContent("Fri 19:00–20:15");
    fireEvent.click(screen.getByRole("button", { name: /Remove Ballet Básico Adulto/ }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("paints the selected chip with the same section tone as the calendar cell", () => {
    render(
      <RegisterSectionPicker
        dict={dictEn.register}
        options={[
          {
            id: A,
            label: "2026 — Ballet Básico Adulto",
            hasOpenSeat: true,
            offersTrial: true,
            slots: [{ dayOfWeek: 5, startTime: "19:00", endTime: "20:15" }],
          },
          {
            id: B,
            label: "2026 — HHK inicial",
            hasOpenSeat: true,
            offersTrial: true,
            slots: [{ dayOfWeek: 6, startTime: "10:00", endTime: "11:00" }],
          },
        ]}
        intent="reserve"
        selectedIds={[A, B]}
        onChange={vi.fn()}
        initialView="calendar"
      />,
    );
    const balletCell = screen.getByRole("button", { name: /Ballet Básico Adulto 19:00/ });
    const hhkCell = screen.getByRole("button", { name: /HHK inicial 10:00/ });
    const chips = screen.getByTestId("register-week-selected").querySelectorAll("li");
    expect(balletCell).toHaveAttribute("data-section-tone", chips[0]?.getAttribute("data-section-tone"));
    expect(hhkCell).toHaveAttribute("data-section-tone", chips[1]?.getAttribute("data-section-tone"));
    expect(balletCell.getAttribute("data-section-tone")).not.toBe(hhkCell.getAttribute("data-section-tone"));
    expect(balletCell).toHaveStyle({ color: chips[0]?.style.color });
    expect(hhkCell).toHaveStyle({ color: chips[1]?.style.color });
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

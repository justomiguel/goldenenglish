import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PortalCalendarAssistPanel } from "@/components/organisms/PortalCalendarAssistPanel";
import dictEn from "@/dictionaries/en.json";

describe("PortalCalendarAssistPanel", () => {
  it("opens color reference dialog when clicking the palette button", async () => {
    const user = userEvent.setup();
    render(<PortalCalendarAssistPanel dict={dictEn.dashboard.portalCalendar} feedUrl={null} />);
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.portalCalendar.schedule.colorReferenceButton }));
    expect(screen.getByRole("heading", { name: dictEn.dashboard.portalCalendar.schedule.colorReferenceTitle })).toBeInTheDocument();
    expect(screen.getByText(dictEn.dashboard.portalCalendar.legend.class)).toBeInTheDocument();
  });

  it("opens sync dialog when clicking sync button", async () => {
    const user = userEvent.setup();
    render(<PortalCalendarAssistPanel dict={dictEn.dashboard.portalCalendar} feedUrl={null} />);
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.portalCalendar.schedule.syncDialogButton }));
    expect(screen.getByRole("heading", { name: dictEn.dashboard.portalCalendar.sync.title })).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Dictionary } from "@/types/i18n";
import en from "@/dictionaries/en.json";
import { ParentWardProfileForm } from "@/components/parent/ParentWardProfileForm";

const updateWardProfile = vi.fn();

vi.mock("@/app/[locale]/dashboard/parent/child/edit/actions", () => ({
  updateWardProfile: (...args: unknown[]) => updateWardProfile(...args),
}));

const trackEvent = vi.fn();
vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

const labels = en.dashboard.parent as Dictionary["dashboard"]["parent"];

const initial = {
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@example.com",
  phone: "123",
  birth_date: "2010-05-01",
};

describe("ParentWardProfileForm", () => {
  beforeEach(() => {
    updateWardProfile.mockReset();
    trackEvent.mockReset();
  });

  it("submits and shows success when update succeeds", async () => {
    const user = userEvent.setup();
    updateWardProfile.mockResolvedValue({ ok: true });
    render(<ParentWardProfileForm locale="en" studentId="s1" initial={initial} labels={labels} />);
    await user.click(screen.getByRole("button", { name: labels.saveWard }));
    expect(updateWardProfile).toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent(labels.wardSaved);
    expect(trackEvent).toHaveBeenCalled();
  });

  it("shows forbidden message", async () => {
    const user = userEvent.setup();
    updateWardProfile.mockResolvedValue({ ok: false, message: labels.wardForbidden });
    render(<ParentWardProfileForm locale="en" studentId="s1" initial={initial} labels={labels} />);
    await user.click(screen.getByRole("button", { name: labels.saveWard }));
    expect(await screen.findByRole("alert")).toHaveTextContent(labels.wardForbidden);
  });

  it("shows unauthorized copy from server", async () => {
    const user = userEvent.setup();
    updateWardProfile.mockResolvedValue({
      ok: false,
      message: en.actionErrors.messaging.unauthorized,
    });
    render(<ParentWardProfileForm locale="en" studentId="s1" initial={initial} labels={labels} />);
    await user.click(screen.getByRole("button", { name: labels.saveWard }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      en.actionErrors.messaging.unauthorized,
    );
  });

  it("shows email taken message", async () => {
    const user = userEvent.setup();
    updateWardProfile.mockResolvedValue({ ok: false, message: labels.wardEmailTaken });
    render(<ParentWardProfileForm locale="en" studentId="s1" initial={initial} labels={labels} />);
    await user.click(screen.getByRole("button", { name: labels.saveWard }));
    expect(await screen.findByRole("alert")).toHaveTextContent(labels.wardEmailTaken);
  });

  it("shows generic error", async () => {
    const user = userEvent.setup();
    updateWardProfile.mockResolvedValue({ ok: false, message: labels.wardError });
    render(<ParentWardProfileForm locale="en" studentId="s1" initial={initial} labels={labels} />);
    await user.click(screen.getByRole("button", { name: labels.saveWard }));
    expect(await screen.findByRole("alert")).toHaveTextContent(labels.wardError);
  });

  it("updates controlled fields when typing", async () => {
    const user = userEvent.setup();
    updateWardProfile.mockResolvedValue({ ok: true });
    render(<ParentWardProfileForm locale="en" studentId="s1" initial={initial} labels={labels} />);
    const fn = screen.getByLabelText(labels.wardFirstName);
    await user.clear(fn);
    await user.type(fn, "Grace");
    expect(fn).toHaveValue("Grace");
  });

  it("handles null phone and birth_date in initial data", () => {
    render(
      <ParentWardProfileForm
        locale="en"
        studentId="s1"
        initial={{
          first_name: "A",
          last_name: "B",
          email: "a@b.co",
          phone: null,
          birth_date: null,
        }}
        labels={labels}
      />,
    );
    expect(screen.getByLabelText(labels.wardPhone)).toHaveValue("");
    expect(screen.getByLabelText(labels.wardBirthDate)).toHaveValue("");
  });

  it("exposes parent dashboard link with locale prefix", () => {
    render(<ParentWardProfileForm locale="en" studentId="s1" initial={initial} labels={labels} />);
    const link = screen.getByRole("link", { name: new RegExp(labels.navHome) });
    expect(link).toHaveAttribute("href", "/en/dashboard/parent");
  });

  it("updates every editable field", async () => {
    const user = userEvent.setup();
    updateWardProfile.mockResolvedValue({ ok: true });
    render(<ParentWardProfileForm locale="en" studentId="s1" initial={initial} labels={labels} />);
    await user.clear(screen.getByLabelText(labels.wardLastName));
    await user.type(screen.getByLabelText(labels.wardLastName), "Hopper");
    await user.clear(screen.getByLabelText(labels.wardEmail));
    await user.type(screen.getByLabelText(labels.wardEmail), "g@h.co");
    await user.clear(screen.getByLabelText(labels.wardPhone));
    await user.type(screen.getByLabelText(labels.wardPhone), "555");
    await user.clear(screen.getByLabelText(labels.wardBirthDate));
    await user.type(screen.getByLabelText(labels.wardBirthDate), "2011-06-07");
    expect(screen.getByLabelText(labels.wardLastName)).toHaveValue("Hopper");
    expect(screen.getByLabelText(labels.wardEmail)).toHaveValue("g@h.co");
    expect(screen.getByLabelText(labels.wardPhone)).toHaveValue("555");
    expect(screen.getByLabelText(labels.wardBirthDate)).toHaveValue("2011-06-07");
  });

  describe("care notes", () => {
    const care = { healthNote: "Mild asthma", dietNote: null, supportNote: null };

    it("shows the care fields with what is already recorded", () => {
      render(
        <ParentWardProfileForm
          locale="en"
          studentId="s1"
          initial={initial}
          care={care}
          labels={labels}
        />,
      );

      expect(screen.getByLabelText(labels.wardCareHealth)).toHaveValue("Mild asthma");
      expect(screen.getByLabelText(labels.wardCareDiet)).toHaveValue("");
      expect(screen.getByText(labels.wardCareLead)).toBeInTheDocument();
    });

    it("hides them from a tutor who may not read them", () => {
      render(
        <ParentWardProfileForm
          locale="en"
          studentId="s1"
          initial={initial}
          care={null}
          labels={labels}
        />,
      );

      expect(screen.queryByLabelText(labels.wardCareHealth)).not.toBeInTheDocument();
    });

    it("sends the care notes along with the rest", async () => {
      const user = userEvent.setup();
      updateWardProfile.mockResolvedValue({ ok: true });
      render(
        <ParentWardProfileForm
          locale="en"
          studentId="s1"
          initial={initial}
          care={care}
          labels={labels}
        />,
      );

      await user.type(screen.getByLabelText(labels.wardCareDiet), "No gluten");
      await user.click(screen.getByRole("button", { name: labels.saveWard }));

      expect(updateWardProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          care_health_note: "Mild asthma",
          care_diet_note: "No gluten",
          care_support_note: "",
        }),
      );
    });

    it("omits the care keys entirely when the fields are not shown", async () => {
      const user = userEvent.setup();
      updateWardProfile.mockResolvedValue({ ok: true });
      render(<ParentWardProfileForm locale="en" studentId="s1" initial={initial} labels={labels} />);

      await user.click(screen.getByRole("button", { name: labels.saveWard }));

      // Sending empty strings here would wipe notes the tutor never saw.
      const payload = updateWardProfile.mock.calls[0]![0] as Record<string, unknown>;
      expect(payload).not.toHaveProperty("care_health_note");
    });
  });
});

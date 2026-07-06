import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadEventAttendeeCustomFieldValues } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";

vi.mock("@/lib/supabase/chunkedIn", () => ({
  chunkedIn: vi.fn(),
}));

import { chunkedIn } from "@/lib/supabase/chunkedIn";

describe("loadEventAttendeeCustomFieldValues", () => {
  beforeEach(() => {
    vi.mocked(chunkedIn).mockReset();
  });

  it("groups custom field answers by attendee with localized labels", async () => {
    vi.mocked(chunkedIn).mockResolvedValue([
      {
        attendee_id: "att-1",
        value_text: "Colegio Norte",
        value_number: null,
        value_date: null,
        file_storage_path: null,
        event_form_fields: {
          field_key: "school_name",
          label_i18n: { es: "Colegio", en: "School" },
          archived_at: null,
        },
      },
    ]);

    const result = await loadEventAttendeeCustomFieldValues({} as never, ["att-1"], "es");

    expect(result["att-1"]).toEqual([
      {
        fieldKey: "school_name",
        label: "Colegio",
        displayValue: "Colegio Norte",
      },
    ]);
  });

  it("returns empty map when no attendee ids are provided", async () => {
    const result = await loadEventAttendeeCustomFieldValues({} as never, [], "es");
    expect(result).toEqual({});
    expect(chunkedIn).not.toHaveBeenCalled();
  });
});

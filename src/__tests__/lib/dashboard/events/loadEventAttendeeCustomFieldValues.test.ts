import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadEventAttendeeCustomFieldValues } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";

vi.mock("@/lib/supabase/chunkedIn", () => ({
  chunkedIn: vi.fn(),
}));

vi.mock("@/lib/events/createEventUploadReadSignedUrl", () => ({
  createEventUploadReadSignedUrlMap: vi.fn(),
}));

import { chunkedIn } from "@/lib/supabase/chunkedIn";
import { createEventUploadReadSignedUrlMap } from "@/lib/events/createEventUploadReadSignedUrl";

describe("loadEventAttendeeCustomFieldValues", () => {
  beforeEach(() => {
    vi.mocked(chunkedIn).mockReset();
    vi.mocked(createEventUploadReadSignedUrlMap).mockReset();
    vi.mocked(createEventUploadReadSignedUrlMap).mockResolvedValue(new Map());
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
          field_type: "text",
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
        fieldType: "text",
        fileStoragePath: null,
        previewUrl: null,
      },
    ]);
  });

  it("exposes basename and signed preview URL for image uploads", async () => {
    const path = "evt-1/staging/abc/field-1/photo-99.jpg";
    vi.mocked(chunkedIn).mockResolvedValue([
      {
        attendee_id: "att-1",
        value_text: null,
        value_number: null,
        value_date: null,
        file_storage_path: path,
        event_form_fields: {
          field_key: "photo",
          field_type: "image",
          label_i18n: { es: "Foto" },
          archived_at: null,
        },
      },
    ]);
    vi.mocked(createEventUploadReadSignedUrlMap).mockResolvedValue(
      new Map([[path, "https://signed.example/photo.jpg"]]),
    );

    const result = await loadEventAttendeeCustomFieldValues({} as never, ["att-1"], "es");

    expect(result["att-1"]?.[0]).toMatchObject({
      fieldKey: "photo",
      displayValue: "photo-99.jpg",
      fieldType: "image",
      fileStoragePath: path,
      previewUrl: "https://signed.example/photo.jpg",
    });
  });

  it("returns empty map when no attendee ids are provided", async () => {
    const result = await loadEventAttendeeCustomFieldValues({} as never, [], "es");
    expect(result).toEqual({});
    expect(chunkedIn).not.toHaveBeenCalled();
  });
});

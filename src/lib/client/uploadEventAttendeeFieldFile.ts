export interface UploadEventAttendeeFieldFileInput {
  slug: string;
  locale: string;
  fieldId: string;
  email: string;
  dniOrPassport: string;
  file: File;
}

export type UploadEventAttendeeFieldFileResult =
  | {
      ok: true;
      path: string;
      fileSizeBytes: number;
      fileMimeType: string;
    }
  | { ok: false; code: string };

export async function uploadEventAttendeeFieldFile(
  input: UploadEventAttendeeFieldFileInput,
): Promise<UploadEventAttendeeFieldFileResult> {
  const form = new FormData();
  form.set("fieldId", input.fieldId);
  form.set("email", input.email);
  form.set("dniOrPassport", input.dniOrPassport);
  form.set("locale", input.locale);
  form.set("file", input.file);

  const response = await fetch(
    `/api/events/${encodeURIComponent(input.slug)}/field-file`,
    { method: "POST", body: form },
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        code?: string;
        path?: string;
        fileSizeBytes?: number;
        fileMimeType?: string;
      }
    | null;

  if (!response.ok || !payload?.ok || !payload.path) {
    return { ok: false, code: payload?.code ?? "upload_failed" };
  }

  return {
    ok: true,
    path: payload.path,
    fileSizeBytes: Number(payload.fileSizeBytes ?? input.file.size),
    fileMimeType: payload.fileMimeType ?? input.file.type,
  };
}

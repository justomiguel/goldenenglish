export type ContentActionFailureCode =
  | "invalid_input"
  | "empty_body"
  | "persist_failed"
  | "forbidden"
  | "duplicate_title"
  | "schema_not_ready"
  | "feature_disabled";

export type ContentActionResult =
  | { ok: true; id: string }
  | { ok: false; code: ContentActionFailureCode };

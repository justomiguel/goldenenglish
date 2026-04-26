export type ContentActionResult =
  | { ok: true; id: string }
  | { ok: false; code: "invalid_input" | "empty_body" | "persist_failed" | "forbidden" };

const PREFIX = "course_order:";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function buildCourseOrderGatewayReference(orderId: string): string {
  return `${PREFIX}${orderId}`;
}

export function parseCourseOrderGatewayReference(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value.startsWith(PREFIX)) return null;
  const id = value.slice(PREFIX.length).trim();
  return UUID_RE.test(id) ? id : null;
}

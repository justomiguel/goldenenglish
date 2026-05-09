/** Coerce Flow POST/query values to the string used for signing and sending. */
export function stringifyFlowParamValue(value: string | number): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "0";
    if (Number.isInteger(value)) return String(value);
    return String(value);
  }
  return value;
}

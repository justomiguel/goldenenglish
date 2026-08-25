/** Make a PostgREST `.or()` operand so `.` `@` and spaces stay in the value. */
export function quotePostgrestFilterValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

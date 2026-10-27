export function AcademicProfileDirectoryCells({
  values,
  emptyValue,
}: {
  values: string[] | undefined;
  emptyValue: string;
}) {
  if (!values || values.length === 0) return null;
  return (
    <>
      {values.map((value, index) => (
        <td key={index} className="min-w-0 break-words px-3 py-3.5 align-top text-sm text-[var(--color-foreground)]">
          {value || emptyValue}
        </td>
      ))}
    </>
  );
}

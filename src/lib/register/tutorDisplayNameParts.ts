export type TutorDisplayDefaults = {
  defaultFirstName: string;
  emptyLastName: string;
};

/** Split single tutor name field (public registration) using locale-aware fallbacks. */
export function splitTutorDisplayName(
  tutorName: string | null | undefined,
  d: TutorDisplayDefaults,
): {
  firstName: string;
  lastName: string;
} {
  const t = tutorName?.trim() ?? "";
  if (!t) return { firstName: d.defaultFirstName, lastName: d.emptyLastName };
  const i = t.indexOf(" ");
  if (i === -1) return { firstName: t, lastName: d.emptyLastName };
  return {
    firstName: t.slice(0, i).trim() || d.defaultFirstName,
    lastName: t.slice(i + 1).trim() || d.emptyLastName,
  };
}

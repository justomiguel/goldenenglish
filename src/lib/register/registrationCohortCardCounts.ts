export type RegistrationCohortCardCounts = {
  total: number;
  pending: number;
  contacted: number;
  enrolled: number;
};

export function emptyRegistrationCohortCardCounts(): RegistrationCohortCardCounts {
  return { total: 0, pending: 0, contacted: 0, enrolled: 0 };
}

/** Header cards for one cohort. Total includes every lead in that set. */
export function registrationCohortCardCounts(
  rows: readonly { status: string }[],
): RegistrationCohortCardCounts {
  let pending = 0;
  let contacted = 0;
  let enrolled = 0;
  for (const row of rows) {
    if (row.status === "new") pending += 1;
    else if (row.status === "contacted") contacted += 1;
    else if (row.status === "enrolled") enrolled += 1;
  }
  return { total: rows.length, pending, contacted, enrolled };
}

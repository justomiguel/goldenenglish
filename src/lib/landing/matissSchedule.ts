/**
 * Matiss Studio weekly groups. Pure data: the age control and the schedule
 * section both read this module. Times are local wall-clock, "HH:MM".
 */
export interface MatissGroup {
  id: "babys-san-miguel" | "senior-san-miguel" | "babys-la-florida";
  location: "sanMiguel" | "laFlorida";
  day: "saturday";
  ageMin: number;
  ageMax: number;
  start: string;
  end: string;
}

export const MATISS_GROUPS: readonly MatissGroup[] = [
  {
    id: "babys-san-miguel",
    location: "sanMiguel",
    day: "saturday",
    ageMin: 3,
    ageMax: 6,
    start: "12:30",
    end: "13:30",
  },
  {
    id: "senior-san-miguel",
    location: "sanMiguel",
    day: "saturday",
    ageMin: 7,
    ageMax: 13,
    start: "13:30",
    end: "15:00",
  },
  {
    id: "babys-la-florida",
    location: "laFlorida",
    day: "saturday",
    ageMin: 4,
    ageMax: 7,
    start: "19:00",
    end: "20:00",
  },
];

/** Youngest and oldest age the studio accepts. */
export const MATISS_AGE_RANGE = { min: 3, max: 13 } as const;

/** Groups a girl of this age can join. Ages outside the range match nothing. */
export function matissGroupsForAge(age: number): MatissGroup[] {
  if (!Number.isInteger(age)) return [];
  return MATISS_GROUPS.filter((group) => age >= group.ageMin && age <= group.ageMax);
}

export type CohortYearContext = {
  year: number;
  existing: { id: string; name: string } | null;
  targetCohort: { id: string; name: string } | null;
};

export async function fetchCohortYearContext(): Promise<CohortYearContext | null> {
  try {
    const res = await fetch("/api/admin/tutorials/cohort-year", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as CohortYearContext;
    if (typeof data.year !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

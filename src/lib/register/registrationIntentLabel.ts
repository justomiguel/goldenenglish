export function registrationIntentLabel(
  labels: { intentReserve: string; intentTrial: string },
  intent?: "reserve" | "trial",
): string {
  return intent === "trial" ? labels.intentTrial : labels.intentReserve;
}

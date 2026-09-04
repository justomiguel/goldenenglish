import { registrationIsActionable } from "@/lib/register/registrationIsActionable";

export function canStartRegistrationJoinCharge(row: {
  intent?: "reserve" | "trial";
  status: string;
}): boolean {
  return row.intent === "trial" && registrationIsActionable(row.status);
}

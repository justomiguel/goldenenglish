"use server";

import { lookupRegistrationStudent } from "@/lib/register/lookupRegistrationStudent";
import type { LookupRegistrationStudentResult } from "@/lib/register/lookupRegistrationStudent";

export async function lookupRegistrationStudentAction(
  dni: string,
): Promise<LookupRegistrationStudentResult> {
  return lookupRegistrationStudent(dni);
}

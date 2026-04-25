"use server";

import {
  searchAdminParentsForDetailAction as searchAdminParentsForDetailImpl,
  updateAdminUserDetailFieldAction as updateAdminUserDetailFieldImpl,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailProfileActions";
import {
  setAdminUserPasswordFromDetailAction as setAdminUserPasswordFromDetailImpl,
  replaceMinorStudentTutorFromDetailAction as replaceMinorStudentTutorFromDetailImpl,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions";
import { uploadAdminStudentAvatarAction as uploadAdminStudentAvatarImpl } from "@/app/[locale]/dashboard/admin/users/adminUserDetailAvatarActions";
import type { AdminParentSearchHit } from "@/types/adminUsers";

export async function searchAdminParentsForDetailAction(
  query: string,
): Promise<AdminParentSearchHit[]> {
  return searchAdminParentsForDetailImpl(query);
}

export async function updateAdminUserDetailFieldAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  return updateAdminUserDetailFieldImpl(raw);
}

export async function setAdminUserPasswordFromDetailAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  return setAdminUserPasswordFromDetailImpl(raw);
}

export async function replaceMinorStudentTutorFromDetailAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  return replaceMinorStudentTutorFromDetailImpl(raw);
}

export async function uploadAdminStudentAvatarAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  return uploadAdminStudentAvatarImpl(formData);
}

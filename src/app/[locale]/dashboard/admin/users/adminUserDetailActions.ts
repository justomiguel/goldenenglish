"use server";

import {
  searchAdminParentsForDetailAction as searchAdminParentsForDetailImpl,
  updateAdminUserDetailFieldAction as updateAdminUserDetailFieldImpl,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailProfileActions";
import { setAdminUserPasswordFromDetailAction as setAdminUserPasswordFromDetailImpl } from "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions";
import {
  upsertAdminStudentTutorLinkAction as upsertAdminStudentTutorLinkImpl,
  createAdminParentAndLinkStudentAction as createAdminParentAndLinkStudentImpl,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailTutorActions";
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

export async function upsertAdminStudentTutorLinkAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  return upsertAdminStudentTutorLinkImpl(raw);
}

export async function createAdminParentAndLinkStudentAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  return createAdminParentAndLinkStudentImpl(raw);
}

export async function uploadAdminStudentAvatarAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  return uploadAdminStudentAvatarImpl(formData);
}

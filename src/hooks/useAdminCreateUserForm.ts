"use client";

import type { Dictionary } from "@/types/i18n";
import { type FormEvent, useCallback, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { createDashboardUser } from "@/app/[locale]/dashboard/admin/users/actions";
import {
  createAdminParentAndLinkStudentAction,
  searchAdminParentsForDetailAction,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import type { TutorStudentRelationshipCode } from "@/lib/register/tutorStudentRelationship";
import type { AdminCreateUserRoleOption } from "@/components/dashboard/AdminCreateUserPersonalBlock";

export function useAdminCreateUserForm(opts: {
  locale: string;
  legalAgeMajority: number;
  labels: Dictionary["admin"]["users"];
  birthDateIncompleteMessage: string;
}) {
  const { locale, legalAgeMajority, labels, birthDateIncompleteMessage } = opts;
  const router = useRouter();
  const passwordHintId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminCreateUserRoleOption>("student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [guardianMode, setGuardianMode] = useState<"existing" | "new">("existing");
  const [pickedGuardian, setPickedGuardian] = useState<AdminStudentSearchHitLike | null>(null);
  const [guardianSearchKey, setGuardianSearchKey] = useState(0);
  const [tutorDni, setTutorDni] = useState("");
  const [tutorFirstName, setTutorFirstName] = useState("");
  const [tutorLastName, setTutorLastName] = useState("");
  const [tutorEmail, setTutorEmail] = useState("");
  const [tutorPhone, setTutorPhone] = useState("");
  const [relationship, setRelationship] = useState<TutorStudentRelationshipCode | "">("");
  const [reuseConfirm, setReuseConfirm] = useState<{
    userId: string;
    existingProfileId: string;
    reuseKind: "reused_parent" | "reused_admin";
  } | null>(null);
  const [reuseBusy, setReuseBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const isStudent = role === "student";
  const showBirth = isStudent;
  const ageOk = birthDate.length === 10;
  const showMinor = isStudent && ageOk && fullYearsFromIsoDate(birthDate) < legalAgeMajority;
  const showAdultStudentEmail = isStudent && ageOk && !showMinor;

  const searchParents = useCallback(
    (q: string) =>
      searchAdminParentsForDetailAction(q).then((rows) =>
        rows.map((r) => ({ id: r.id, label: r.label })),
      ),
    [],
  );

  function resetGuardianUi() {
    setPickedGuardian(null);
    setGuardianSearchKey((k) => k + 1);
    setTutorDni("");
    setTutorFirstName("");
    setTutorLastName("");
    setTutorEmail("");
    setTutorPhone("");
    setRelationship("");
  }

  async function confirmReuseLink() {
    if (!reuseConfirm || !relationship) return;
    setReuseBusy(true);
    const r = await createAdminParentAndLinkStudentAction({
      locale,
      studentId: reuseConfirm.userId,
      tutorDni: tutorDni.trim(),
      tutorFirstName: tutorFirstName.trim(),
      tutorLastName: tutorLastName.trim(),
      tutorEmail: tutorEmail.trim(),
      tutorPhone: tutorPhone.trim() || undefined,
      relationship,
      confirmReuseOfProfileId: reuseConfirm.existingProfileId,
    });
    setReuseBusy(false);
    if (r.ok) {
      setReuseConfirm(null);
      setFeedback({ ok: true, text: labels.success });
      router.push(`/${locale}/dashboard/admin/users`);
      return;
    }
    setFeedback({
      ok: false,
      text: "message" in r ? (r.message ?? labels.error) : labels.error,
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    setReuseConfirm(null);

    if (isStudent && birthDate.length !== 10) {
      setBusy(false);
      setFeedback({ ok: false, text: birthDateIncompleteMessage });
      return;
    }

    if (showMinor) {
      if (!dni.trim()) {
        setBusy(false);
        setFeedback({ ok: false, text: labels.errCreateMinorStudentDniRequired });
        return;
      }
      if (!relationship) {
        setBusy(false);
        setFeedback({ ok: false, text: labels.detailErrTutorRelationshipRequired });
        return;
      }
      if (guardianMode === "existing" && !pickedGuardian) {
        setBusy(false);
        setFeedback({ ok: false, text: labels.errCreateGuardianPickRequired });
        return;
      }
    }

    const res = await createDashboardUser({
      email: showMinor ? "" : email,
      password,
      role,
      first_name: firstName,
      last_name: lastName,
      dni_or_passport: dni,
      phone: showMinor ? "" : phone,
      birth_date: showBirth ? birthDate : undefined,
      student_guardian_mode: showMinor ? guardianMode : undefined,
      existing_guardian_id: showMinor && guardianMode === "existing" ? pickedGuardian?.id : undefined,
      tutor_dni: showMinor && guardianMode === "new" ? tutorDni : undefined,
      tutor_first_name: showMinor && guardianMode === "new" ? tutorFirstName : undefined,
      tutor_last_name: showMinor && guardianMode === "new" ? tutorLastName : undefined,
      tutor_email: showMinor && guardianMode === "new" ? tutorEmail : undefined,
      tutor_phone: showMinor && guardianMode === "new" ? tutorPhone : undefined,
      tutor_relationship: showMinor ? relationship : undefined,
      locale,
    });
    setBusy(false);

    if (res.ok === false && "needsGuardianReuseConfirm" in res && res.needsGuardianReuseConfirm) {
      setReuseConfirm({
        userId: res.userId,
        existingProfileId: res.existingProfileId,
        reuseKind: res.reuseKind,
      });
      return;
    }

    const text = res.ok
      ? labels.success
      : "message" in res
        ? (res.message ?? labels.error)
        : labels.error;
    setFeedback({ ok: res.ok, text });
    if (res.ok) {
      router.push(`/${locale}/dashboard/admin/users`);
    }
  }

  return {
    passwordHintId,
    email,
    setEmail,
    password,
    setPassword,
    role,
    setRole,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    dni,
    setDni,
    phone,
    setPhone,
    birthDate,
    setBirthDate,
    guardianMode,
    setGuardianMode,
    pickedGuardian,
    setPickedGuardian,
    guardianSearchKey,
    setGuardianSearchKey,
    tutorDni,
    setTutorDni,
    tutorFirstName,
    setTutorFirstName,
    tutorLastName,
    setTutorLastName,
    tutorEmail,
    setTutorEmail,
    tutorPhone,
    setTutorPhone,
    relationship,
    setRelationship,
    reuseConfirm,
    setReuseConfirm,
    reuseBusy,
    feedback,
    busy,
    isStudent,
    showBirth,
    showMinor,
    showAdultStudentEmail,
    searchParents,
    resetGuardianUi,
    confirmReuseLink,
    onSubmit,
  };
}

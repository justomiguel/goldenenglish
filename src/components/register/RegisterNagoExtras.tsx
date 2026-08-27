"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { RegisterNagoProtocol } from "@/components/register/RegisterNagoProtocol";
import type { Dictionary } from "@/types/i18n";

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;

export interface RegisterNagoExtrasProps {
  dict: Dictionary["register"];
  isMinor: boolean;
  busy: boolean;
  showUseTutor: boolean;
  tutorPrefill: { name: string; relationship: string; phone: string } | null;
  signerPrefill: { name: string; dni: string };
}

function YesNo({
  name,
  legend,
  yes,
  no,
}: {
  name: string;
  legend: string;
  yes: string;
  no: string;
}) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name={name} value="no" required defaultChecked />
          {no}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name={name} value="yes" required />
          {yes}
        </label>
      </div>
    </fieldset>
  );
}

export function RegisterNagoExtras({
  dict,
  isMinor,
  busy,
  showUseTutor,
  tutorPrefill,
  signerPrefill,
}: RegisterNagoExtrasProps) {
  const pack = dict.nagoPack;
  const [useTutor, setUseTutor] = useState(false);
  const emergencyKey = useTutor ? "tutor" : "manual";

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-semibold">{pack.stepTitle}</h2>
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{pack.studentExtraTitle}</legend>
        <div>
          <Label htmlFor="nago-nat" required>{pack.nationality}</Label>
          <Input id="nago-nat" name="nago_nationality" required className="mt-1 w-full" />
        </div>
        <div>
          <Label htmlFor="nago-addr" required>{pack.address}</Label>
          <Input id="nago-addr" name="nago_address" required className="mt-1 w-full" />
        </div>
        <div>
          <Label htmlFor="nago-com" required>{pack.commune}</Label>
          <Input id="nago-com" name="nago_commune" required className="mt-1 w-full" />
        </div>
        <div>
          <Label htmlFor="nago-school" required={isMinor}>{pack.school}</Label>
          <Input id="nago-school" name="nago_school" required={isMinor} className="mt-1 w-full" />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{pack.healthTitle}</legend>
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">{pack.healthInsurance}</legend>
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="nago_health_insurance" value="fonasa" required defaultChecked />
              {pack.healthInsuranceFonasa}
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="nago_health_insurance" value="isapre" required />
              {pack.healthInsuranceIsapre}
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="nago_health_insurance" value="other" required />
              {pack.healthInsuranceOther}
            </label>
          </div>
        </fieldset>
        <div>
          <Label htmlFor="nago-ins-other">{pack.healthInsuranceOtherSpecify}</Label>
          <Input id="nago-ins-other" name="nago_health_insurance_other" className="mt-1 w-full" />
        </div>
        <div>
          <Label htmlFor="nago-blood">{pack.bloodType}</Label>
          <select id="nago-blood" name="nago_blood_type" className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
            <option value="unknown">{pack.bloodTypeUnknown}</option>
            {BLOOD_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <YesNo name="nago_has_allergies" legend={pack.hasAllergies} yes={pack.yes} no={pack.no} />
        <div>
          <Label htmlFor="nago-all">{pack.specify}</Label>
          <Input id="nago-all" name="nago_allergies_detail" className="mt-1 w-full" />
        </div>
        <YesNo name="nago_has_condition" legend={pack.hasMedicalCondition} yes={pack.yes} no={pack.no} />
        <div>
          <Label htmlFor="nago-cond">{pack.specify}</Label>
          <Input id="nago-cond" name="nago_condition_detail" className="mt-1 w-full" />
        </div>
        <div>
          <Label htmlFor="nago-clinic" required>{pack.preferredHealthCenter}</Label>
          <Input id="nago-clinic" name="nago_health_center" required className="mt-1 w-full" />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{pack.emergencyTitle}</legend>
        {showUseTutor && tutorPrefill ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useTutor}
              onChange={(event) => setUseTutor(event.currentTarget.checked)}
            />
            {pack.useTutorData}
          </label>
        ) : null}
        <div key={emergencyKey} className="space-y-3">
          <div>
            <Label htmlFor="nago-em-name" required>{pack.emergencyName}</Label>
            <Input
              id="nago-em-name"
              name="nago_emergency_name"
              required
              defaultValue={useTutor ? tutorPrefill?.name ?? "" : ""}
              className="mt-1 w-full"
            />
          </div>
          <div>
            <Label htmlFor="nago-em-rel" required>{pack.emergencyRelationship}</Label>
            <Input
              id="nago-em-rel"
              name="nago_emergency_relationship"
              required
              defaultValue={useTutor ? tutorPrefill?.relationship ?? "" : ""}
              className="mt-1 w-full"
            />
          </div>
          <div>
            <Label htmlFor="nago-em-ph" required>{pack.emergencyPhone}</Label>
            <Input
              id="nago-em-ph"
              name="nago_emergency_phone"
              required
              defaultValue={useTutor ? tutorPrefill?.phone ?? "" : ""}
              className="mt-1 w-full"
            />
          </div>
        </div>
      </fieldset>

      <RegisterNagoProtocol
        dict={dict}
        signerName={signerPrefill.name}
        signerDni={signerPrefill.dni}
      />

      <Button type="submit" disabled={busy} isLoading={busy}>
        {!busy ? <UserPlus className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {dict.submit}
      </Button>
    </div>
  );
}

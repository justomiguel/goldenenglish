import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { nagoProtocolSections } from "@/lib/register/packs/nago/nagoProtocolSections";
import { NAGO_PROTOCOL_VERSION } from "@/lib/register/packs/nago/protocolVersion";
import type { Dictionary } from "@/types/i18n";

interface RegisterNagoProtocolProps {
  dict: Dictionary["register"];
  signerName: string;
  signerDni: string;
}

export function RegisterNagoProtocol({
  dict,
  signerName,
  signerDni,
}: RegisterNagoProtocolProps) {
  const proto = dict.nagoProtocol;
  const sections = nagoProtocolSections(proto.sections);

  return (
    <fieldset className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-4">
      <legend className="px-1 text-sm font-semibold">{proto.title}</legend>
      <input type="hidden" name="nago_protocol_version" value={NAGO_PROTOCOL_VERSION} />
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {sections.map((section, index) => (
          <details key={section.id} className="rounded-md border border-[var(--color-border)] p-3" open={index === 0}>
            <summary className="cursor-pointer text-sm font-medium">{section.title}</summary>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{section.body}</p>
          </details>
        ))}
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="nago_protocol_accepted" value="yes" required className="mt-1" />
        <span>{proto.acceptLabel}</span>
      </label>
      <div>
        <Label htmlFor="nago-signer-name" required>{proto.signerName}</Label>
        <Input id="nago-signer-name" name="nago_signer_name" required defaultValue={signerName} className="mt-1 w-full" />
      </div>
      <div>
        <Label htmlFor="nago-signer-dni" required>{proto.signerDni}</Label>
        <Input id="nago-signer-dni" name="nago_signer_dni" required defaultValue={signerDni} className="mt-1 w-full" />
      </div>
    </fieldset>
  );
}

import {
  NAGO_PROTOCOL_SECTION_IDS,
  type NagoProtocolSectionId,
} from "@/lib/register/packs/nago/protocolVersion";

export interface NagoProtocolSectionCopy {
  title: string;
  body: string;
}

export function nagoProtocolSections(
  sections: Record<NagoProtocolSectionId, NagoProtocolSectionCopy>,
): Array<NagoProtocolSectionCopy & { id: NagoProtocolSectionId }> {
  return NAGO_PROTOCOL_SECTION_IDS.map((id) => ({ id, ...sections[id] }));
}

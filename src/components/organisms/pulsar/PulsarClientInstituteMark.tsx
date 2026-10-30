import Image from "next/image";

export interface PulsarClientInstituteMarkProps {
  src: string;
}

export function PulsarClientInstituteMark({ src }: PulsarClientInstituteMarkProps) {
  return (
    <span className="relative inline-block h-12 w-28 shrink-0">
      <Image
        src={src}
        alt=""
        fill
        sizes="14rem"
        className="object-contain object-left"
      />
    </span>
  );
}

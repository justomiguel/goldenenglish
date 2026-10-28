import Image from "next/image";

export interface PulsarClientInstituteMarkProps {
  src: string;
}

export function PulsarClientInstituteMark({ src }: PulsarClientInstituteMarkProps) {
  return (
    <Image
      src={src}
      alt=""
      width={360}
      height={112}
      className="h-28 w-auto max-w-[18rem] shrink-0 object-contain object-left"
    />
  );
}

import { CloseFrame, type CloseVariantProps } from "@/variants/close/CloseFrame";

export default function CloseNarrow(props: CloseVariantProps) {
  return <CloseFrame layout="narrow" {...props} />;
}

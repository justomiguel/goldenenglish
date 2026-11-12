import { CloseFrame, type CloseVariantProps } from "@/variants/close/CloseFrame";

export default function CloseQuiet(props: CloseVariantProps) {
  return <CloseFrame layout="quiet" {...props} />;
}

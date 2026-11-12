import { CloseFrame, type CloseVariantProps } from "@/variants/close/CloseFrame";

export default function ClosePaper(props: CloseVariantProps) {
  return <CloseFrame layout="paper" {...props} />;
}

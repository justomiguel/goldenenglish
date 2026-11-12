import { CloseFrame, type CloseVariantProps } from "@/variants/close/CloseFrame";

export default function CloseStage(props: CloseVariantProps) {
  return <CloseFrame layout="stage" {...props} />;
}

import {
  FilePenLine,
  FileSpreadsheet,
  FileText,
  Files,
  Headphones,
  Image as ImageIcon,
  MonitorPlay,
  Presentation,
  Video,
} from "lucide-react";
import type { AttachmentDisplayKind } from "@/lib/learning-tasks/attachmentDisplayKind";

interface AttachmentKindIconProps {
  kind: AttachmentDisplayKind;
  className?: string;
}

export function AttachmentKindIcon({ kind, className = "h-5 w-5" }: AttachmentKindIconProps) {
  const stroke = { strokeWidth: 2.1 } as const;

  switch (kind) {
    case "embed":
      return <MonitorPlay className={className} aria-hidden strokeWidth={stroke.strokeWidth} />;
    case "pdf":
      return <FileText className={className} aria-hidden strokeWidth={stroke.strokeWidth} />;
    case "word":
      return <FilePenLine className={className} aria-hidden strokeWidth={stroke.strokeWidth} />;
    case "spreadsheet":
      return <FileSpreadsheet className={className} aria-hidden strokeWidth={stroke.strokeWidth} />;
    case "presentation":
      return <Presentation className={className} aria-hidden strokeWidth={stroke.strokeWidth} />;
    case "office":
      return <Files className={className} aria-hidden strokeWidth={stroke.strokeWidth} />;
    case "video":
      return <Video className={className} aria-hidden strokeWidth={stroke.strokeWidth} />;
    case "audio":
      return <Headphones className={className} aria-hidden strokeWidth={stroke.strokeWidth} />;
    case "image":
      return <ImageIcon className={className} aria-hidden strokeWidth={stroke.strokeWidth} />;
    default:
      return <FileText className={className} aria-hidden strokeWidth={stroke.strokeWidth} />;
  }
}

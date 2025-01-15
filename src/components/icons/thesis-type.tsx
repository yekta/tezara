import { cn } from "@/components/ui/utils";
import {
  BrushIcon,
  GraduationCapIcon,
  PenToolIcon,
  SyringeIcon,
  TrophyIcon,
} from "lucide-react";
import { ComponentProps } from "react";

const defaultClassName = "size-5 shrink-0";

type TVariant =
  | "Yüksek Lisans"
  | "Doktora"
  | "Tıpta Uzmanlık"
  | "Sanatta Yeterlik"
  | string
  | null;

export function getThesisTypeColorClassName(variant: TVariant) {
  if (variant === "Yüksek Lisans") {
    return "text-chart-1 bg-chart-1/10 border-chart-1/16";
  }
  if (variant === "Doktora") {
    return "text-chart-2 bg-chart-2/10 border-chart-2/16";
  }
  if (variant === "Tıpta Uzmanlık") {
    return "text-chart-3 bg-chart-3/10 border-chart-3/16";
  }
  if (variant === "Sanatta Yeterlik") {
    return "text-chart-4 bg-chart-4/10 border-chart-4/16";
  }
  return "text-foreground bg-foreground/8 border-foreground/12";
}

export default function ThesisTypeIcon({
  className,
  variant,
}: ComponentProps<"svg"> & { variant: TVariant }) {
  if (variant === "Yüksek Lisans") {
    return <GraduationCapIcon className={cn(defaultClassName, className)} />;
  }
  if (variant === "Doktora") {
    return <TrophyIcon className={cn(defaultClassName, className)} />;
  }
  if (variant === "Tıpta Uzmanlık") {
    return <SyringeIcon className={cn(defaultClassName, className)} />;
  }
  if (variant === "Sanatta Yeterlik") {
    return <BrushIcon className={cn(defaultClassName, className)} />;
  }
  return <PenToolIcon className={cn(defaultClassName, className)} />;
}

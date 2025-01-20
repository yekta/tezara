import { cn } from "@/components/ui/utils";
import {
  BrushIcon,
  GraduationCapIcon,
  PenToolIcon,
  PillIcon,
  SyringeIcon,
  TestTubeDiagonalIcon,
  TrophyIcon,
} from "lucide-react";
import { ComponentProps } from "react";

const defaultClassName = "size-5 shrink-0";

type TVariant =
  | "Yüksek Lisans"
  | "Doktora"
  | "Tıpta Uzmanlık"
  | "Sanatta Yeterlik"
  | "Diş Hekimliği Uzmanlık"
  | "Tıpta Yan Dal Uzmanlık"
  | "Eczacılıkta Uzmanlık"
  | string
  | null;

export function getThesisTypeColorClassName({
  variant,
  classType = "chip",
}: {
  variant: TVariant;
  classType?: "variable" | "chip" | "faded-icon";
}) {
  if (variant === "Yüksek Lisans") {
    if (classType === "variable") return "hsl(var(--chart-1))";
    if (classType === "faded-icon") return "text-chart-1/25";
    return "text-chart-1 bg-chart-1/10 border-chart-1/16";
  }
  if (variant === "Doktora") {
    if (classType === "variable") return "hsl(var(--chart-2))";
    if (classType === "faded-icon") return "text-chart-2/25";
    return "text-chart-2 bg-chart-2/10 border-chart-2/16";
  }
  if (variant === "Tıpta Uzmanlık") {
    if (classType === "variable") return "hsl(var(--chart-3))";
    if (classType === "faded-icon") return "text-chart-3/25";
    return "text-chart-3 bg-chart-3/10 border-chart-3/16";
  }
  if (variant === "Sanatta Yeterlik") {
    if (classType === "variable") return "hsl(var(--chart-4))";
    if (classType === "faded-icon") return "text-chart-4/25";
    return "text-chart-4 bg-chart-4/10 border-chart-4/16";
  }
  if (variant === "Diş Hekimliği Uzmanlık") {
    if (classType === "variable") return "hsl(var(--chart-5))";
    if (classType === "faded-icon") return "text-chart-5/25";
    return "text-chart-5 bg-chart-5/10 border-chart-5/16";
  }
  if (variant === "Tıpta Yan Dal Uzmanlık") {
    if (classType === "variable") return "hsl(var(--chart-6))";
    if (classType === "faded-icon") return "text-chart-6/25";
    return "text-chart-6 bg-chart-6/10 border-chart-6/16";
  }
  if (variant === "Eczacılıkta Uzmanlık") {
    if (classType === "variable") return "hsl(var(--chart-7))";
    if (classType === "faded-icon") return "text-chart-7/25";
    return "text-chart-7 bg-chart-7/10 border-chart-7/16";
  }

  if (classType === "variable") return "hsl(var(--foreground))";
  if (classType === "faded-icon") return "text-foreground/25";
  return "text-foreground bg-foreground/8 border-foreground/12";
}

export default function ThesisTypeIcon({
  className,
  variant,
  style,
}: ComponentProps<"svg"> & { variant: TVariant }) {
  if (variant === "Yüksek Lisans") {
    return (
      <GraduationCapIcon
        style={style}
        className={cn(defaultClassName, className)}
      />
    );
  }
  if (variant === "Doktora") {
    return (
      <TrophyIcon style={style} className={cn(defaultClassName, className)} />
    );
  }
  if (variant === "Tıpta Uzmanlık") {
    return (
      <SyringeIcon style={style} className={cn(defaultClassName, className)} />
    );
  }
  if (variant === "Sanatta Yeterlik") {
    return (
      <BrushIcon style={style} className={cn(defaultClassName, className)} />
    );
  }
  if (variant === "Diş Hekimliği Uzmanlık") {
    return (
      <svg
        style={style}
        className={cn(defaultClassName, className)}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          d="M12 4.38S13 3 16 3s5 2.5 5 5-1 4-2 7-1.5 6-3 6-1.5-6.5-4-6.5S9 21 8 21s-2-3-3-6-2-3-2-6 2.5-5.5 5.5-5.5S13 5 14 7"
        />
      </svg>
    );
  }
  if (variant === "Tıpta Yan Dal Uzmanlık") {
    return (
      <TestTubeDiagonalIcon
        style={style}
        className={cn(defaultClassName, className)}
      />
    );
  }
  if (variant === "Eczacılıkta Uzmanlık") {
    return (
      <PillIcon style={style} className={cn(defaultClassName, className)} />
    );
  }
  return (
    <PenToolIcon style={style} className={cn(defaultClassName, className)} />
  );
}

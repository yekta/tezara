import { TVariant } from "@/components/icons/sets/thesis-type";
import { cn } from "@/components/ui/utils";
import { ComponentProps } from "react";

const defaultClassName = "font-icon";

export default function ThesisTypeIconWithFont({
  className,
  variant,
  style,
}: ComponentProps<"svg"> & { variant: TVariant }) {
  if (variant === "Yüksek Lisans") {
    return (
      <span
        style={style}
        className={cn(defaultClassName, "icon-graduation-cap", className)}
      />
    );
  }
  if (variant === "Doktora") {
    return (
      <span
        style={style}
        className={cn(defaultClassName, "icon-trophy", className)}
      />
    );
  }
  if (variant === "Tıpta Uzmanlık") {
    return (
      <span
        style={style}
        className={cn(defaultClassName, "icon-syringe", className)}
      />
    );
  }
  if (variant === "Sanatta Yeterlik") {
    return (
      <span
        style={style}
        className={cn(defaultClassName, "icon-brush", className)}
      />
    );
  }
  if (variant === "Diş Hekimliği Uzmanlık") {
    return (
      <span
        style={style}
        className={cn(defaultClassName, "icon-teeth", className)}
      />
    );
  }
  if (variant === "Tıpta Yan Dal Uzmanlık") {
    return (
      <span
        style={style}
        className={cn(defaultClassName, "icon-test-tube-diagonal", className)}
      />
    );
  }
  if (variant === "Eczacılıkta Uzmanlık") {
    return (
      <span
        style={style}
        className={cn(defaultClassName, "icon-pill", className)}
      />
    );
  }
  return (
    <span
      style={style}
      className={cn(defaultClassName, "icon-pen-tool", className)}
    />
  );
}

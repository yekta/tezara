import { cn } from "@/components/ui/utils";
import { ComponentProps, ReactNode } from "react";

type Props = {
  className?: string;
  children: ReactNode;
};

export default function Chip({
  className,
  children,
  ...props
}: ComponentProps<"p"> & Props) {
  return (
    <p
      {...props}
      className={cn(
        "shrink min-w-0 bg-foreground/10 rounded-full text-sm leading-tight py-0.75 font-semibold px-2.25 data-[pending]:animate-skeleton data-[pending]:text-transparent data-[pending]:bg-foreground/40",
        className
      )}
    >
      {children}
    </p>
  );
}

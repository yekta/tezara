import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

type Props = {
  children: string;
  href?: string;
  disabled?: boolean;
  variant: "prev" | "next";
  className?: string;
};

export default function NextPrevButton({
  variant,
  href,
  disabled,
  children,
  className,
}: Props) {
  return disabled || !href ? (
    <Button
      disabled
      size="sm"
      variant="ghost"
      className={cn("text-muted-foreground min-w-0 shrink gap-1", className)}
    >
      {variant === "prev" && <ChevronLeftIcon className="size-5 -ml-2" />}
      <p className="shrink min-w-0">{children}</p>
      {variant === "next" && <ChevronRightIcon className="size-5 -mr-2" />}
    </Button>
  ) : (
    <LinkButton
      href={href}
      size="sm"
      variant="ghost"
      className={cn("text-muted-foreground min-w-0 shrink gap-1", className)}
    >
      {variant === "prev" && <ChevronLeftIcon className="size-5 -ml-2" />}
      <p className="shrink min-w-0">{children}</p>
      {variant === "next" && <ChevronRightIcon className="size-5 -mr-2" />}
    </LinkButton>
  );
}

import { LinkButton, TButtonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { ArrowLeftIcon } from "lucide-react";

type Props = {
  variant?: TButtonVariants["variant"];
  size?: TButtonVariants["size"];
  href: string;
  className?: string;
};

export default function BackButton({
  size = "sm",
  variant = "ghost",
  href,
  className,
}: Props) {
  return (
    <LinkButton
      href={href}
      variant={variant}
      size={size}
      className={cn("text-muted-foreground", className)}
    >
      <ArrowLeftIcon className="shrink-0 size-5 -ml-1.5" />
      <p className="shrink min-w-0">Geri Dön</p>
    </LinkButton>
  );
}

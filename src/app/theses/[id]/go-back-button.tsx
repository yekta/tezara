import { LinkButton, TButtonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { previousPathAtom } from "@/lib/store/main";
import { useSetAtom } from "jotai";
import { ArrowLeftIcon } from "lucide-react";

type Props = {
  buttonText: string;
  variant?: TButtonVariants["variant"];
  size?: TButtonVariants["size"];
  href: string;
  className?: string;
};

export default function BackButton({
  buttonText,
  size = "sm",
  variant = "ghost",
  href,
  className,
}: Props) {
  const setPreviousPath = useSetAtom(previousPathAtom);

  return (
    <LinkButton
      href={href}
      onClick={() => setPreviousPath(null)}
      variant={variant}
      size={size}
      className={cn("text-muted-foreground", className)}
    >
      <ArrowLeftIcon className="shrink-0 size-5 -ml-2" />
      <p className="shrink min-w-0">{buttonText}</p>
    </LinkButton>
  );
}

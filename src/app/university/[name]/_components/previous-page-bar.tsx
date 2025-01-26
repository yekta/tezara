"use client";

import { universitiesRoute } from "@/app/universities/constants/main";
import { LinkButton, TButtonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { previousPathForUniversitiesPageAtom } from "@/lib/store/main";
import { useAtomValue } from "jotai";
import { ArrowLeftIcon } from "lucide-react";

type Props = {
  className?: string;
  buttonVariant?: TButtonVariants["variant"];
  buttonSize?: TButtonVariants["size"];
};

export default function PreviousPageBar({
  buttonVariant = "ghost",
  buttonSize = "sm",
  className,
}: Props) {
  const previousPath = useAtomValue(previousPathForUniversitiesPageAtom);
  return (
    <div
      className={cn("w-full flex items-center justify-start px-1.5", className)}
    >
      <LinkButton
        href={previousPath ? previousPath : universitiesRoute}
        variant={buttonVariant}
        size={buttonSize}
        prefetch={false}
        className={cn(buttonVariant === "ghost" && "text-muted-foreground")}
      >
        <ArrowLeftIcon className="shrink-0 size-5 -ml-2" />
        <p className="shrink min-w-0">Üniversiteler</p>
      </LinkButton>
    </div>
  );
}

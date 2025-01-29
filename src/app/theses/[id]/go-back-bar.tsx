"use client";

import BackButton from "@/app/theses/[id]/go-back-button";
import { cn } from "@/components/ui/utils";
import { previousPathAtom } from "@/lib/store/main";
import { useAtomValue } from "jotai";

export type TGoBackBarProps = {
  buttonText: string;
  className?: string;
  defaultPath: string;
};

export default function GoBackBar({
  buttonText,
  className,
  defaultPath,
}: TGoBackBarProps) {
  const previousPath = useAtomValue(previousPathAtom);

  return (
    <div className={cn("w-full flex items-center justify-center", className)}>
      <BackButton buttonText={buttonText} href={previousPath || defaultPath} />
    </div>
  );
}
